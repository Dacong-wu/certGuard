export interface Domain {
  id: number
  user_id: number
  domain: string
  port: number
  last_checked: string
  expiry_date: string
  status: 'success' | 'warning' | 'error'
  notes: string
  daysLeft: number
} 