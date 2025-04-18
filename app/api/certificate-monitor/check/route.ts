// app/api/certificate-monitor/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { sendBatchCertificateExpiryEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    // 可选：检查授权（当通过cron触发时）
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.CRON_API_KEY

    // 如果设置了API密钥但请求没有提供正确的密钥，则拒绝访问
    // 这样允许手动触发（无密钥）和cron触发（有密钥）两种方式
    if (apiKey && authHeader !== `Bearer ${apiKey}` && authHeader !== null) {
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
        SELECT id, domain, cert_expiry_date 
        FROM domains 
        WHERE user_id = ?
      `)
      const domains = domainsStmt.all(user.id) as {
        id: number
        domain: string
        cert_expiry_date: string
      }[]

      // 筛选需要警告的域名
      const domainsToNotify = domains.filter(domain => {
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
