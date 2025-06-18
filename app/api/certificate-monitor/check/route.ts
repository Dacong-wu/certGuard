// app/api/certificate-monitor/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { sendBatchCertificateExpiryEmail } from '@/lib/email'
import { checkCertificate } from '@/app/domains/actions'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.CRON_API_KEY

    // 只允许手动通过密钥访问

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取所有用户
    const usersStmt = db.prepare(`
      SELECT id, email FROM users
    `)
    const users = usersStmt.all() as { id: number; email: string }[]

    const results = []

    // 处理每个用户的域名证书检查
    for (const user of users) {
      // 获取用户的通知设置
      const settingsStmt = db.prepare(`
        SELECT email_enabled, warning_days, critical_days 
        FROM notification_settings 
        WHERE user_id = ?
      `)
      const settings = settingsStmt.get(user.id) as
        | {
            email_enabled: number
            warning_days: number
            critical_days: number
          }
        | undefined

      // 如果未找到设置或邮件通知未启用，则跳过该用户
      if (!settings || !settings.email_enabled) {
        results.push({
          userId: user.id,
          email: user.email,
          status: 'skipped',
          reason: !settings
            ? 'No notification settings'
            : 'Email notifications disabled'
        })
        continue
      }

      // 获取用户的所有域名
      const domainsStmt = db.prepare(`
        SELECT id, domain, cert_expiry_date, port
        FROM domains 
        WHERE user_id = ?
      `)
      const domains = domainsStmt.all(user.id) as {
        id: number
        domain: string
        cert_expiry_date: string
        port: number
      }[]

      // 新增：执行证书检查
      for (const domain of domains) {
        const certExpiry = await checkCertificate(domain.domain, domain.port)
        if (
          certExpiry &&
          certExpiry.expiryDate.toISOString() !== domain.cert_expiry_date
        ) {
          const updateCertStmt = db.prepare(`
            UPDATE domains SET cert_expiry_date = ? WHERE id = ?
          `)
          updateCertStmt.run(certExpiry.expiryDate.toISOString(), domain.id)
        }
      }

      // 再次查询已更新的 cert_expiry_date
      const updatedDomains = domainsStmt.all(user.id) as {
        id: number
        domain: string
        cert_expiry_date: string
      }[]

      // 筛选需要警告的域名
      const domainsToNotify = updatedDomains.filter(domain => {
        if (!domain.cert_expiry_date) return false

        const expiryDate = new Date(domain.cert_expiry_date)
        const currentDate = new Date()

        // 计算剩余天数
        const daysLeft = Math.ceil(
          (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        // 如果天数少于等于警告天数或临界天数，则需要通知
        return daysLeft <= settings.warning_days
      })

      // 如果没有需要警告的域名，跳过
      if (domainsToNotify.length === 0) {
        results.push({
          userId: user.id,
          email: user.email,
          status: 'skipped',
          reason: 'No domains need notification'
        })
        continue
      }

      // 准备通知数据
      const notificationData = domainsToNotify.map(domain => {
        const expiryDate = new Date(domain.cert_expiry_date)
        const currentDate = new Date()
        const daysLeft = Math.ceil(
          (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        // 更新域名的daysLeft字段
        const updateStmt = db.prepare(`
          UPDATE domains SET daysLeft = ? WHERE id = ?
        `)
        updateStmt.run(daysLeft, domain.id)

        return {
          domain: domain.domain,
          daysLeft,
          expiryDate: expiryDate.toISOString().split('T')[0] // 格式化为 YYYY-MM-DD
        }
      })

      // 发送批量通知邮件
      const emailResult = await sendBatchCertificateExpiryEmail(
        user.email,
        notificationData
      )

      results.push({
        userId: user.id,
        email: user.email,
        status: emailResult.success ? 'success' : 'failed',
        domains: notificationData.length,
        emailResult
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate check completed',
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error) {
    console.error('Certificate check failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
