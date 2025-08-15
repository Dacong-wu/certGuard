import { sendEmail } from './transporter'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  createCertificateExpiryEmailTemplate,
  createBatchCertificateExpiryEmailTemplate
} from './templates'
import db from '@/lib/db'

// 检查是否启用了邮件通知
async function isEmailNotificationEnabled(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) {
      redirect('/login')
    }
    const settings = await getNotificationSettingsByEmail(userId)
    return !!(settings && settings.email_enabled)
  } catch (error) {
    console.error('检查邮件通知设置失败:', error)
    return false
  }
}

/**
 * 发送证书过期通知邮件
 */
export async function sendCertificateExpiryEmail(
  to: string,
  domain: string,
  daysLeft: number,
  expiryDate: string
) {
  // 检查是否启用了邮件通知
  if (!(await isEmailNotificationEnabled())) {
    console.log('邮件通知未启用，跳过发送')
    return { success: false, error: '邮件通知未启用' }
  }

  console.log('开始发送邮件:', { to, domain, daysLeft, expiryDate })

  const isCritical = daysLeft <= 7
  const subject = isCritical
    ? `紧急：${domain} 的 SSL 证书即将过期`
    : `警告：${domain} 的 SSL 证书即将过期`

  const html = createCertificateExpiryEmailTemplate(
    domain,
    daysLeft,
    expiryDate
  )

  return await sendEmail(to, subject, html)
}

/**
 * 发送批量证书过期通知邮件
 */
export async function sendBatchCertificateExpiryEmail(
  to: string,
  domains: Array<{
    domain: string
    daysLeft: number
    expiryDate: string
  }>
) {
  console.log('开始发送批量邮件:', { to, domains })

  const criticalDomains = domains.filter(d => d.daysLeft <= 7)
  const hasCritical = criticalDomains.length > 0

  const subject = hasCritical
    ? '紧急：多个域名的 SSL 证书即将过期'
    : '警告：多个域名的 SSL 证书即将过期'

  const html = createBatchCertificateExpiryEmailTemplate(domains)

  return await sendEmail(to, subject, html)
}

// 获取邮件通知是否打开功能
async function getNotificationSettingsByEmail(
  userId: string
): Promise<{ email_enabled: boolean } | null> {
  const stmt = db.prepare(`
    SELECT email_enabled FROM notification_settings WHERE user_id = ?
  `)

  const row = stmt.get(userId) as { email_enabled: number } | undefined

  if (row) {
    return { email_enabled: Boolean(row.email_enabled) }
  } else {
    return null // 用户尚未配置通知设置
  }
}
