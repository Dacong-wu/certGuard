export type DomainInfo = {
  user_id: number
  id: number
  domain: string
  port: number
  last_checked: string
  status: string
  daysLeft: number
  notes: string
  cert_serial?: string
  issuer_organization?: string
  issuer_country?: string
  issuer_common_name?: string
  cert_sha1_fingerprint?: string
  cert_sha256_fingerprint?: string
  cert_issue_date?: string
  cert_expiry_date: string
  cert_file?: string
}
