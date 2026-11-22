export const enquiryTypes = [
  { value: 'farmer', label: 'Farmer / Farmer Group' },
  { value: 'investor', label: 'Investor' },
  { value: 'technology-partner', label: 'Technology Partner' },
  { value: 'seafood-buyer', label: 'Seafood Buyer' },
  { value: 'research-institution', label: 'Research Institution' },
  { value: 'development-organisation', label: 'Development Organisation' },
  { value: 'general', label: 'General Enquiry' },
] as const

export type EnquiryType = (typeof enquiryTypes)[number]['value']

export function isEnquiryType(value: unknown): value is EnquiryType {
  return typeof value === 'string' && enquiryTypes.some(option => option.value === value)
}

export function resolveEnquiryType(value: string | string[] | undefined): EnquiryType {
  const candidate = Array.isArray(value) ? value[0] : value
  if (isEnquiryType(candidate)) return candidate
  if (candidate === 'market') return 'seafood-buyer'
  if (candidate === 'institution') return 'research-institution'
  return 'general'
}

export function getEnquiryLabel(value: EnquiryType) {
  return enquiryTypes.find(option => option.value === value)?.label ?? 'General Enquiry'
}
