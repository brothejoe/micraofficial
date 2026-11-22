import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { createServerServiceClient } from '../../../../src/lib/server-rate-limit'

export const runtime = 'nodejs'

const maxFileSize = 4 * 1024 * 1024
const maxPixels = 40_000_000
const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== 'string') return ''
  const clean = [...value].filter(character => {
    const code = character.charCodeAt(0)
    return code >= 32 && code !== 127
  }).join('')
  return clean.trim().slice(0, maxLength)
}

async function getAdminClient(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!token || !url || !anonKey) return null

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) return null
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  if (profileError || !['super_admin', 'content_admin', 'editor'].includes(profile.role)) return null
  return { client, userId: userData.user.id, role: profile.role }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > maxFileSize + 64 * 1024) return jsonError('Image file exceeds the 4 MB limit.', 413)

  const authenticated = await getAdminClient(request)
  if (!authenticated) return jsonError('An authorised CMS account is required.', 401)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError('The upload form is invalid.', 400)
  }
  const file = form.get('file')
  if (!(file instanceof File)) return jsonError('Choose an image file to upload.', 400)
  if (!file.size || file.size > maxFileSize) return jsonError('Image file must be between 1 byte and 4 MB.', 413)
  if (!supportedTypes.has(file.type)) return jsonError('Use JPEG, PNG, WebP or AVIF images only.', 415)

  const title = cleanText(form.get('title'), 160) || file.name.replace(/\.[^.]+$/, '').slice(0, 160)
  const altText = cleanText(form.get('altText'), 500)
  const assetId = cleanText(form.get('id'), 80)
  let path = ''
  if (assetId) {
    const { data: existing, error } = await authenticated.client
      .from('media_assets')
      .select('storage_path, created_by')
      .eq('id', assetId)
      .maybeSingle()
    if (error) return jsonError(`Media record could not be loaded: ${error.message}`, 500)
    if (!existing) return jsonError('The selected media asset does not exist or is not accessible.', 404)
    if (authenticated.role === 'editor' && existing.created_by !== authenticated.userId) {
      return jsonError('Editors can replace only media that they uploaded.', 403)
    }
    path = existing.storage_path
  } else {
    path = `${authenticated.userId}/${randomUUID()}.webp`
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer())
  let outputBuffer: Buffer
  try {
    const image = sharp(inputBuffer, { limitInputPixels: maxPixels, failOn: 'error' })
    const metadata = await image.metadata()
    const detectedType = metadata.format === 'jpeg'
      ? 'image/jpeg'
      : metadata.format === 'png'
        ? 'image/png'
        : metadata.format === 'webp'
          ? 'image/webp'
          : metadata.format === 'heif' && metadata.compression === 'av1'
            ? 'image/avif'
            : ''
    if (detectedType !== file.type || !metadata.width || !metadata.height || metadata.width > 12_000 || metadata.height > 12_000) {
      return jsonError('The uploaded file is not a valid supported image or exceeds the 12,000 px dimension limit.', 415)
    }
    if (metadata.width * metadata.height > maxPixels) return jsonError('Image exceeds the 40 megapixel limit.', 413)
    outputBuffer = await image.rotate().webp({ quality: 86, effort: 4 }).toBuffer()
  } catch {
    return jsonError('The uploaded file could not be safely decoded as an image.', 415)
  }
  if (outputBuffer.length > maxFileSize) return jsonError('Processed image exceeds the 10 MB limit.', 413)

  const serviceClient = createServerServiceClient()
  const { error: storageError } = await serviceClient.storage
    .from('micra-media')
    .upload(path, outputBuffer, { contentType: 'image/webp', cacheControl: '3600', upsert: Boolean(assetId) })
  if (storageError) return jsonError(`Image upload failed: ${storageError.message}`, 500)

  if (assetId) {
    const { error: updateError } = await serviceClient
      .from('media_assets')
      .update({ file_name: title, mime_type: 'image/webp', alt_text: altText })
      .eq('id', assetId)
    if (updateError) return jsonError(`Image was replaced, but its media record could not be updated: ${updateError.message}`, 500)
  } else {
    const { data: metadata, error: insertError } = await serviceClient.from('media_assets').insert({
      storage_path: path,
      file_name: title,
      mime_type: 'image/webp',
      alt_text: altText,
      created_by: authenticated.userId,
    }).select('id').single()
    if (insertError) {
      const { error: cleanupError } = await serviceClient.storage.from('micra-media').remove([path])
      const cleanupDetail = cleanupError ? ` Cleanup also failed: ${cleanupError.message}` : ''
      return jsonError(`Image uploaded but its media record could not be saved: ${insertError.message}.${cleanupDetail}`, 500)
    }
    const { error: activityError } = await serviceClient.from('admin_activity').insert({
      actor_id: authenticated.userId,
      action: 'upload_media',
      entity_type: 'media',
      entity_id: metadata.id,
    })
    if (activityError) return jsonError(`Image was uploaded, but its audit record could not be saved: ${activityError.message}`, 500)
    const { data } = authenticated.client.storage.from('micra-media').getPublicUrl(path)
    return NextResponse.json({ id: metadata.id, path, url: data.publicUrl, name: title, altText }, { status: 201 })
  }

  const { error: activityError } = await serviceClient.from('admin_activity').insert({
    actor_id: authenticated.userId,
    action: 'replace_media',
    entity_type: 'media',
    entity_id: assetId,
  })
  if (activityError) return jsonError(`Image was replaced, but its audit record could not be saved: ${activityError.message}`, 500)
  const { data } = authenticated.client.storage.from('micra-media').getPublicUrl(path)
  return NextResponse.json({ id: assetId, path, url: data.publicUrl, name: title, altText })
}

export async function PATCH(request: Request) {
  const authenticated = await getAdminClient(request)
  if (!authenticated) return jsonError('An authorised CMS account is required.', 401)

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return jsonError('The media update must be valid JSON.', 400)
  }
  if (!input || typeof input !== 'object') return jsonError('The media update is invalid.', 400)
  const body = input as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title')
  const hasAltText = Object.prototype.hasOwnProperty.call(body, 'altText')
  if (!id || (!hasTitle && !hasAltText)) return jsonError('Choose a media asset and a field to update.', 400)
  if (hasTitle && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 160)) {
    return jsonError('Image title must contain 1 to 160 characters.', 400)
  }
  if (hasAltText && (typeof body.altText !== 'string' || body.altText.length > 500)) {
    return jsonError('Alternative text must not exceed 500 characters.', 400)
  }

  const changes = {
    ...(hasTitle && typeof body.title === 'string' ? { file_name: body.title.trim() } : {}),
    ...(hasAltText && typeof body.altText === 'string' ? { alt_text: body.altText.trim() } : {}),
  }
  const serviceClient = createServerServiceClient()
  const { error } = await serviceClient.from('media_assets').update(changes).eq('id', id)
  if (error) return jsonError(`Media details could not be updated: ${error.message}`, 500)
  const { error: activityError } = await serviceClient.from('admin_activity').insert({
    actor_id: authenticated.userId,
    action: 'update_media',
    entity_type: 'media',
    entity_id: id,
  })
  if (activityError) return jsonError(`Media details were updated, but their audit record could not be saved: ${activityError.message}`, 500)
  return NextResponse.json({ updated: true })
}
