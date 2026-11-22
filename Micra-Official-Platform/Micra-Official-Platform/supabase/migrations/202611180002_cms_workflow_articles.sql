do $$
begin
  if not exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'pages'
       and column_name = 'workflow_status'
  ) then
    alter table public.pages
      add column workflow_status text not null default 'draft';
    update public.pages
       set workflow_status = case when published_version_id is null then 'draft' else 'published' end;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pages_workflow_status_check'
  ) then
    alter table public.pages
      add constraint pages_workflow_status_check
      check (workflow_status in ('draft', 'review', 'published', 'archived'));
  end if;
end
$$;

drop policy if exists "Published pages are public" on public.pages;
create policy "Published pages are public"
  on public.pages for select to anon, authenticated
  using (
    (published_version_id is not null and workflow_status <> 'archived')
    or (auth.uid() is not null and public.can_edit_content())
  );

drop policy if exists "Published versions are public" on public.page_versions;
create policy "Published versions are public"
  on public.page_versions for select to anon, authenticated
  using (
    published_at is not null and exists (
      select 1 from public.pages p
       where p.id = page_versions.page_id
         and p.published_version_id = page_versions.id
         and p.workflow_status <> 'archived'
    )
    or (auth.uid() is not null and public.can_edit_content())
  );

create or replace function public.is_page_archived(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pages where slug = p_slug and workflow_status = 'archived'
  )
$$;

revoke execute on function public.is_page_archived(text) from public;
grant execute on function public.is_page_archived(text) to anon, authenticated;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 180),
  workflow_status text not null default 'draft'
    check (workflow_status in ('draft', 'review', 'published', 'archived')),
  draft_version_id uuid,
  published_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  content jsonb not null check (
    jsonb_typeof(content) = 'object'
    and content ?& array['title', 'summary', 'category', 'body', 'seoTitle', 'seoDescription']
    and jsonb_typeof(content -> 'title') = 'string'
    and char_length(content ->> 'title') between 1 and 180
    and jsonb_typeof(content -> 'summary') = 'string'
    and char_length(content ->> 'summary') <= 1000
    and jsonb_typeof(content -> 'category') = 'string'
    and char_length(content ->> 'category') between 1 and 100
    and jsonb_typeof(content -> 'body') = 'string'
    and char_length(content ->> 'body') between 1 and 30000
    and jsonb_typeof(content -> 'seoTitle') = 'string'
    and char_length(content ->> 'seoTitle') <= 180
    and jsonb_typeof(content -> 'seoDescription') = 'string'
    and char_length(content ->> 'seoDescription') <= 500
  ),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (article_id, version_number)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'articles_draft_version_fk') then
    alter table public.articles add constraint articles_draft_version_fk
      foreign key (draft_version_id) references public.article_versions (id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'articles_published_version_fk') then
    alter table public.articles add constraint articles_published_version_fk
      foreign key (published_version_id) references public.article_versions (id) on delete set null;
  end if;
end
$$;

create index if not exists article_versions_article_created_idx
  on public.article_versions (article_id, created_at desc);

alter table public.admin_activity add column if not exists entity_label text;

create table if not exists public.rate_limit_windows (
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (key_hash, window_started_at)
);

create index if not exists rate_limit_windows_started_idx
  on public.rate_limit_windows (window_started_at);

alter table public.rate_limit_windows enable row level security;

drop policy if exists "Public submit enquiries" on public.enquiries;
revoke insert on public.enquiries from anon, authenticated;

drop policy if exists "Admins add media" on public.media_assets;
drop policy if exists "Admins update media" on public.media_assets;
revoke insert, update on public.media_assets from authenticated;

drop policy if exists "Editors can upload MICRA media" on storage.objects;
drop policy if exists "Editors can replace own MICRA media" on storage.objects;

drop policy if exists "Super admins delete media metadata" on public.media_assets;
create policy "Content admins delete media metadata"
  on public.media_assets for delete to authenticated
  using (public.can_publish_content());

drop policy if exists "Super admins can delete MICRA media" on storage.objects;
create policy "Content admins can delete MICRA media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'micra-media' and public.can_publish_content());

create or replace function public.consume_rate_limit(p_key_hash text, p_window_seconds integer, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  window_start timestamptz;
  next_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Akses ditolak.';
  end if;
  if p_key_hash is null
    or p_key_hash !~ '^[0-9a-f]{64}$'
    or p_window_seconds is null
    or p_window_seconds not between 60 and 3600
    or p_limit is null
    or p_limit not between 1 and 100 then
    raise exception 'Parameter rate limit tidak valid.';
  end if;

  window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  insert into public.rate_limit_windows (key_hash, window_started_at, request_count)
  values (p_key_hash, window_start, 1)
  on conflict (key_hash, window_started_at)
  do update set request_count = rate_limit_windows.request_count + 1
  returning request_count into next_count;

  delete from public.rate_limit_windows
   where window_started_at < now() - interval '1 day';
  return next_count <= p_limit;
end;
$$;

revoke all on table public.rate_limit_windows from public, anon, authenticated;
revoke execute on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

create or replace function public.save_page_draft(p_page_id uuid, p_content jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  new_version_id uuid;
  current_status text;
begin
  if not public.can_edit_content() then
    raise exception 'Akses ditolak: pengguna tidak dapat mengedit konten.';
  end if;
  if jsonb_typeof(p_content) <> 'object' then
    raise exception 'Konten halaman harus berupa objek JSON.';
  end if;

  select workflow_status into current_status from public.pages where id = p_page_id for update;
  if not found then
    raise exception 'Halaman tidak ditemukan.';
  end if;

  select coalesce(max(version_number), 0) + 1
    into next_version
    from public.page_versions
   where page_id = p_page_id;

  insert into public.page_versions (page_id, version_number, content, created_by)
  values (p_page_id, next_version, p_content, auth.uid())
  returning id into new_version_id;

  update public.pages
     set draft_version_id = new_version_id,
         workflow_status = case when current_status = 'archived' then 'archived' else 'draft' end,
         updated_at = now()
   where id = p_page_id;

  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'save_draft', 'page', p_page_id);

  return new_version_id;
end;
$$;

create or replace function public.publish_page_draft(p_page_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_id uuid;
begin
  if not public.can_publish_content() then
    raise exception 'Akses ditolak: hanya Content Admin dan Super Admin yang dapat menerbitkan.';
  end if;

  select draft_version_id into draft_id
    from public.pages
   where id = p_page_id
   for update;
  if not found then
    raise exception 'Halaman tidak ditemukan.';
  end if;
  if draft_id is null then
    raise exception 'Simpan draft sebelum menerbitkan halaman.';
  end if;

  update public.page_versions set published_at = now() where id = draft_id;
  update public.pages
     set published_version_id = draft_id, workflow_status = 'published', updated_at = now()
   where id = p_page_id;

  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'publish', 'page', p_page_id);
end;
$$;

create or replace function public.restore_page_version(p_page_id uuid, p_version_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  restored_version_id uuid;
  current_status text;
begin
  if not public.can_edit_content() then
    raise exception 'Akses ditolak: pengguna tidak dapat mengedit konten.';
  end if;

  select workflow_status into current_status from public.pages where id = p_page_id for update;
  if not found then
    raise exception 'Halaman tidak ditemukan.';
  end if;

  select coalesce(max(version_number), 0) + 1
    into next_version
    from public.page_versions
   where page_id = p_page_id;

  insert into public.page_versions (page_id, version_number, content, created_by)
  select p_page_id, next_version, content, auth.uid()
    from public.page_versions
   where id = p_version_id and page_id = p_page_id
  returning id into restored_version_id;
  if restored_version_id is null then
    raise exception 'Versi yang dipilih tidak ditemukan.';
  end if;

  update public.pages
     set draft_version_id = restored_version_id,
         workflow_status = case when current_status = 'archived' then 'archived' else 'draft' end,
         updated_at = now()
   where id = p_page_id;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'restore_version', 'page', p_page_id);
  return restored_version_id;
end;
$$;

create or replace function public.request_page_review(p_page_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_edit_content() then
    raise exception 'Akses ditolak: pengguna tidak dapat mengirim konten untuk ditinjau.';
  end if;
  update public.pages
     set workflow_status = 'review', updated_at = now()
   where id = p_page_id and draft_version_id is not null and workflow_status <> 'archived';
  if not found then
    raise exception 'Simpan draft halaman sebelum meminta peninjauan.';
  end if;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'request_review', 'page', p_page_id);
end;
$$;

create or replace function public.archive_page(p_page_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_publish_content() then
    raise exception 'Akses ditolak: hanya Content Admin dan Super Admin yang dapat mengarsipkan.';
  end if;
  update public.pages set workflow_status = 'archived', updated_at = now() where id = p_page_id;
  if not found then
    raise exception 'Halaman tidak ditemukan.';
  end if;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'archive', 'page', p_page_id);
end;
$$;

create or replace function public.create_article(p_slug text, p_content jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_article_id uuid;
  new_version_id uuid;
begin
  if not public.can_edit_content() then
    raise exception 'Akses ditolak: pengguna tidak dapat membuat artikel.';
  end if;
  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(p_slug) > 180 then
    raise exception 'Alamat artikel hanya boleh berisi huruf kecil, angka, dan tanda hubung.';
  end if;
  if p_content is null
    or jsonb_typeof(p_content) <> 'object'
    or not (p_content ?& array['title', 'summary', 'category', 'body', 'seoTitle', 'seoDescription'])
    or not (
    jsonb_typeof(p_content) = 'object'
    and jsonb_typeof(p_content -> 'title') = 'string'
    and char_length(p_content ->> 'title') between 1 and 180
    and jsonb_typeof(p_content -> 'summary') = 'string'
    and char_length(p_content ->> 'summary') <= 1000
    and jsonb_typeof(p_content -> 'category') = 'string'
    and char_length(p_content ->> 'category') between 1 and 100
    and jsonb_typeof(p_content -> 'body') = 'string'
    and char_length(p_content ->> 'body') between 1 and 30000
    and jsonb_typeof(p_content -> 'seoTitle') = 'string'
    and char_length(p_content ->> 'seoTitle') <= 180
    and jsonb_typeof(p_content -> 'seoDescription') = 'string'
    and char_length(p_content ->> 'seoDescription') <= 500
  ) then
    raise exception 'Isi artikel tidak valid.';
  end if;

  insert into public.articles (slug) values (p_slug) returning id into new_article_id;
  insert into public.article_versions (article_id, version_number, content, created_by)
  values (new_article_id, 1, p_content, auth.uid())
  returning id into new_version_id;
  update public.articles set draft_version_id = new_version_id where id = new_article_id;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'create_article', 'article', new_article_id);
  return new_article_id;
end;
$$;

create or replace function public.save_article_draft(p_article_id uuid, p_content jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  new_version_id uuid;
  current_status text;
begin
  if not public.can_edit_content() then
    raise exception 'Akses ditolak: pengguna tidak dapat mengedit artikel.';
  end if;
  if p_content is null
    or jsonb_typeof(p_content) <> 'object'
    or not (p_content ?& array['title', 'summary', 'category', 'body', 'seoTitle', 'seoDescription'])
    or not (
    jsonb_typeof(p_content) = 'object'
    and jsonb_typeof(p_content -> 'title') = 'string'
    and char_length(p_content ->> 'title') between 1 and 180
    and jsonb_typeof(p_content -> 'summary') = 'string'
    and char_length(p_content ->> 'summary') <= 1000
    and jsonb_typeof(p_content -> 'category') = 'string'
    and char_length(p_content ->> 'category') between 1 and 100
    and jsonb_typeof(p_content -> 'body') = 'string'
    and char_length(p_content ->> 'body') between 1 and 30000
    and jsonb_typeof(p_content -> 'seoTitle') = 'string'
    and char_length(p_content ->> 'seoTitle') <= 180
    and jsonb_typeof(p_content -> 'seoDescription') = 'string'
    and char_length(p_content ->> 'seoDescription') <= 500
  ) then
    raise exception 'Isi artikel tidak valid.';
  end if;

  select workflow_status into current_status from public.articles where id = p_article_id for update;
  if not found then
    raise exception 'Artikel tidak ditemukan.';
  end if;
  select coalesce(max(version_number), 0) + 1 into next_version
    from public.article_versions where article_id = p_article_id;
  insert into public.article_versions (article_id, version_number, content, created_by)
  values (p_article_id, next_version, p_content, auth.uid())
  returning id into new_version_id;
  update public.articles
     set draft_version_id = new_version_id,
         workflow_status = case when current_status = 'archived' then 'archived' else 'draft' end,
         updated_at = now()
   where id = p_article_id;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'save_article_draft', 'article', p_article_id);
  return new_version_id;
end;
$$;

create or replace function public.request_article_review(p_article_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_edit_content() then
    raise exception 'Akses ditolak: pengguna tidak dapat mengirim artikel untuk ditinjau.';
  end if;
  update public.articles
     set workflow_status = 'review', updated_at = now()
   where id = p_article_id and draft_version_id is not null and workflow_status <> 'archived';
  if not found then
    raise exception 'Simpan draft artikel sebelum meminta peninjauan.';
  end if;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'request_article_review', 'article', p_article_id);
end;
$$;

create or replace function public.publish_article(p_article_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_id uuid;
begin
  if not public.can_publish_content() then
    raise exception 'Akses ditolak: hanya Content Admin dan Super Admin yang dapat menerbitkan artikel.';
  end if;
  select draft_version_id into draft_id from public.articles where id = p_article_id for update;
  if not found then
    raise exception 'Artikel tidak ditemukan.';
  end if;
  if draft_id is null then
    raise exception 'Simpan draft artikel sebelum menerbitkan.';
  end if;
  update public.article_versions set published_at = now() where id = draft_id;
  update public.articles
     set published_version_id = draft_id, workflow_status = 'published', updated_at = now()
   where id = p_article_id;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'publish_article', 'article', p_article_id);
end;
$$;

create or replace function public.archive_article(p_article_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_publish_content() then
    raise exception 'Akses ditolak: hanya Content Admin dan Super Admin yang dapat mengarsipkan artikel.';
  end if;
  update public.articles set workflow_status = 'archived', updated_at = now() where id = p_article_id;
  if not found then
    raise exception 'Artikel tidak ditemukan.';
  end if;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'archive_article', 'article', p_article_id);
end;
$$;

create or replace function public.restore_article_version(p_article_id uuid, p_version_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  restored_version_id uuid;
  current_status text;
begin
  if not public.can_edit_content() then
    raise exception 'Akses ditolak: pengguna tidak dapat memulihkan artikel.';
  end if;
  select workflow_status into current_status from public.articles where id = p_article_id for update;
  if not found then
    raise exception 'Artikel tidak ditemukan.';
  end if;
  select coalesce(max(version_number), 0) + 1 into next_version
    from public.article_versions where article_id = p_article_id;
  insert into public.article_versions (article_id, version_number, content, created_by)
  select p_article_id, next_version, content, auth.uid()
    from public.article_versions
   where id = p_version_id and article_id = p_article_id
  returning id into restored_version_id;
  if restored_version_id is null then
    raise exception 'Versi artikel tidak ditemukan.';
  end if;
  update public.articles
     set draft_version_id = restored_version_id,
         workflow_status = case when current_status = 'archived' then 'archived' else 'draft' end,
         updated_at = now()
   where id = p_article_id;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'restore_article_version', 'article', p_article_id);
  return restored_version_id;
end;
$$;

alter table public.articles enable row level security;
alter table public.article_versions enable row level security;

drop policy if exists "Published articles are public" on public.articles;
create policy "Published articles are public"
  on public.articles for select to anon, authenticated
  using (
    (workflow_status <> 'archived' and published_version_id is not null)
    or (auth.uid() is not null and public.can_edit_content())
  );
drop policy if exists "Article versions visible by publication" on public.article_versions;
create policy "Article versions visible by publication"
  on public.article_versions for select to anon, authenticated
  using (
    (published_at is not null and exists (
      select 1 from public.articles a
       where a.id = article_versions.article_id
         and a.published_version_id = article_versions.id
         and a.workflow_status <> 'archived'
    ))
    or (auth.uid() is not null and public.can_edit_content())
  );

grant select on public.articles, public.article_versions to anon, authenticated;
grant select, insert, update, delete on public.articles, public.article_versions to authenticated;

revoke execute on function public.request_page_review(uuid) from public, anon;
revoke execute on function public.archive_page(uuid) from public, anon;
revoke execute on function public.create_article(text, jsonb) from public, anon;
revoke execute on function public.save_article_draft(uuid, jsonb) from public, anon;
revoke execute on function public.request_article_review(uuid) from public, anon;
revoke execute on function public.publish_article(uuid) from public, anon;
revoke execute on function public.archive_article(uuid) from public, anon;
revoke execute on function public.restore_article_version(uuid, uuid) from public, anon;
grant execute on function public.request_page_review(uuid) to authenticated;
grant execute on function public.archive_page(uuid) to authenticated;
grant execute on function public.create_article(text, jsonb) to authenticated;
grant execute on function public.save_article_draft(uuid, jsonb) to authenticated;
grant execute on function public.request_article_review(uuid) to authenticated;
grant execute on function public.publish_article(uuid) to authenticated;
grant execute on function public.archive_article(uuid) to authenticated;
grant execute on function public.restore_article_version(uuid, uuid) to authenticated;

create or replace function public.audit_media_asset_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    insert into public.admin_activity (actor_id, action, entity_type, entity_id)
    values (auth.uid(), 'delete_media', 'media', old.id);
    return old;
  end if;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id)
  values (
    auth.uid(),
    case when tg_op = 'INSERT' then 'upload_media' else 'update_media' end,
    'media',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists audit_media_asset_changes on public.media_assets;
create trigger audit_media_asset_changes
  after insert or update or delete on public.media_assets
  for each row execute function public.audit_media_asset_change();

create or replace function public.audit_site_setting_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.admin_activity (actor_id, action, entity_type, entity_label)
    values (auth.uid(), 'delete_site_setting', 'site_setting', old.key);
    return old;
  end if;
  insert into public.admin_activity (actor_id, action, entity_type, entity_label)
  values (auth.uid(), case when tg_op = 'INSERT' then 'create_site_setting' else 'update_site_setting' end, 'site_setting', new.key);
  return new;
end;
$$;

drop trigger if exists audit_site_setting_changes on public.site_settings;
create trigger audit_site_setting_changes
  after insert or update or delete on public.site_settings
  for each row execute function public.audit_site_setting_change();

create or replace function public.audit_enquiry_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.admin_activity (actor_id, action, entity_type, entity_id, entity_label)
    values (auth.uid(), 'update_enquiry_status', 'enquiry', new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists audit_enquiry_status_changes on public.enquiries;
create trigger audit_enquiry_status_changes
  after update of status on public.enquiries
  for each row execute function public.audit_enquiry_status_change();

grant select on public.articles, public.article_versions to anon;
