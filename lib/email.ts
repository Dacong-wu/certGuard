import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

// 创建邮件传输器
const createTransporter = () => {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  }

  console.log('SMTP 配置:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    // 不打印密码
  })

  return nodemailer.createTransport(config)
}

// 发送证书过期通知邮件
export async function sendCertificateExpiryEmail(
  to: string,
  domain: string,
  daysLeft: number,
  expiryDate: string
) {
  const settings = await getNotificationSettingsByEmail(to)
  if (!settings || !settings.email_enabled) {
    console.log('邮件通知未启用，跳过发送')
    return { success: false, error: '邮件通知未启用' }
  }
  console.log('开始发送邮件:', { to, domain, daysLeft, expiryDate })
  
  const transporter = createTransporter()
  const isCritical = daysLeft <= 7
  const subject = isCritical
    ? `紧急：${domain} 的 SSL 证书即将过期` 
    : `警告：${domain} 的 SSL 证书即将过期`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            color: #24292f;
            margin: 0;
            padding: 0;
            background-color: #f6f8fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .content {
            background: white;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 32px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 16px;
            color: ${isCritical ? '#cf222e' : '#9a6700'};
          }
          .domain {
            font-weight: 600;
            color: #24292f;
          }
          .days {
            font-weight: 600;
            color: ${isCritical ? '#cf222e' : '#9a6700'};
          }
          .date {
            color: #57606a;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #2da44e;
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 16px;
          }
          .footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #d0d7de;
            color: #57606a;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1 class="title">${subject}</h1>
            
            <p>您好，</p>
            <p>我们检测到您监控的域名 <span class="domain">${domain}</span> 的 SSL 证书将在 <span class="days">${daysLeft}</span> 天后过期。</p>
            <p class="date">过期日期：${expiryDate}</p>
            <p>请及时更新证书以避免服务中断。</p>            
          </div>
          
          <div class="footer">
            <p>此邮件由证书监控系统自动发送，请勿回复。</p>
            <p>如果您不想接收此类通知，可以在系统设置中关闭邮件通知。</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    console.log('准备发送邮件...')
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to,
      subject,
      html,
    })
    console.log('邮件发送成功:', info.messageId)
    return { success: true }
  } catch (error) {
    console.error('发送邮件失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '发送邮件失败' 
    }
  }
}

// 发送批量证书过期通知邮件
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
  const warningDomains = domains.filter(d => d.daysLeft > 7 && d.daysLeft <= 30)
  const hasCritical = criticalDomains.length > 0

  const transporter = createTransporter()
  const subject = hasCritical
    ? `紧急：多个域名的 SSL 证书即将过期`
    : `警告：多个域名的 SSL 证书即将过期`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            color: #24292f;
            margin: 0;
            padding: 0;
            background-color: #f6f8fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .content {
            background: white;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 32px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 16px;
            color: ${hasCritical ? '#cf222e' : '#9a6700'};
          }
          .domain-list {
            margin: 16px 0;
            padding: 0;
            list-style: none;
          }
          .domain-item {
            padding: 12px;
            border-bottom: 1px solid #d0d7de;
          }
          .domain-item:last-child {
            border-bottom: none;
          }
          .domain {
            font-weight: 600;
            color: #24292f;
          }
          .days {
            font-weight: 600;
            color: ${hasCritical ? '#cf222e' : '#9a6700'};
          }
          .date {
            color: #57606a;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #2da44e;
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 16px;
          }
          .footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #d0d7de;
            color: #57606a;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1 class="title">${subject}</h1>
            
            <p>您好，</p>
            <p>我们检测到您监控的多个域名的 SSL 证书即将过期：</p>
            
            ${criticalDomains.length > 0 ? `
              <h3 style="color: #cf222e; margin-top: 16px;">紧急警告（7天内过期）</h3>
              <ul class="domain-list">
                ${criticalDomains.map(d => `
                  <li class="domain-item">
                    <span class="domain">${d.domain}</span>
                    <br>
                    <span class="days">剩余 ${d.daysLeft} 天</span>
                    <span class="date">过期日期：${d.expiryDate}</span>
                  </li>
                `).join('')}
              </ul>
            ` : ''}

            ${warningDomains.length > 0 ? `
              <h3 style="color: #9a6700; margin-top: 16px;">普通警告（30天内过期）</h3>
              <ul class="domain-list">
                ${warningDomains.map(d => `
                  <li class="domain-item">
                    <span class="domain">${d.domain}</span>
                    <br>
                    <span class="days">剩余 ${d.daysLeft} 天</span>
                    <span class="date">过期日期：${d.expiryDate}</span>
                  </li>
                `).join('')}
              </ul>
            ` : ''}
            
            <p>请及时更新这些域名的证书以避免服务中断。</p>
          </div>
          
          <div class="footer">
            <p>此邮件由证书监控系统自动发送，请勿回复。</p>
            <p>如果您不想接收此类通知，可以在系统设置中关闭邮件通知。</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    console.log('准备发送批量邮件...')
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to,
      subject,
      html,
    })
    console.log('批量邮件发送成功:', info.messageId)
    return { success: true }
  } catch (error) {
    console.error('发送批量邮件失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '发送批量邮件失败' 
    }
  }
}