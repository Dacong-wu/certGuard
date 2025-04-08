import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { sendBatchCertificateExpiryEmail } from '@/lib/email'
import { calculateDaysLeft } from '@/lib/utils'

interface Domain {
  domain: string
  expiry_date: string
}

interface DomainWithDaysLeft {
  domain: string
  daysLeft: number
  expiryDate: string
}

export async function GET() {
  try {
    // 获取所有启用了邮件通知的用户
    const users = db.prepare(`
      SELECT u.id, u.email, ns.warning_days, ns.critical_days
      FROM users u
      JOIN notification_settings ns ON u.id = ns.user_id
      WHERE ns.email_enabled = 1
    `).all()

    for (const user of users) {
      // 获取用户的所有域名
      const domains = db.prepare(`
        SELECT domain, expiry_date
        FROM domains
        WHERE user_id = ?
      `).all(user.id) as Domain[]

      // 计算每个域名的剩余天数
      const domainsWithDaysLeft = domains.map((domain: Domain) => ({
        domain: domain.domain,
        daysLeft: calculateDaysLeft(domain.expiry_date),
        expiryDate: domain.expiry_date
      }))

      // 过滤出需要通知的域名
      const domainsToNotify = domainsWithDaysLeft.filter((d: DomainWithDaysLeft) => 
        d.daysLeft <= user.warning_days
      )

      if (domainsToNotify.length > 0) {
        // 发送批量通知邮件
        await sendBatchCertificateExpiryEmail(
          user.email,
          domainsToNotify
        )

        // 更新最后通知时间
        db.prepare(`
          UPDATE notification_settings
          SET last_notified = datetime('now')
          WHERE user_id = ?
        `).run(user.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('检查证书失败:', error)
    return NextResponse.json(
      { success: false, error: '检查证书失败' },
      { status: 500 }
    )
  }
} 