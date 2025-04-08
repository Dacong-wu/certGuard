import nodemailer from 'nodemailer'

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// 验证邮件配置
export async function verifyEmailConfig() {
  try {
    await transporter.verify()
    console.log('邮件服务器配置验证成功')
    return true
  } catch (error) {
    console.error('邮件服务器配置验证失败:', error)
    return false
  }
}

// 发送邮件
export async function sendMail(to: string, subject: string, content: string) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #24292e; margin: 0;">证书监控系统</h1>
          </div>
          
          <div style="background-color: #f6f8fa; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
            <div style="font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #24292e; line-height: 1.2;">
              ${content.trim()}
            </div>
          </div>
          
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e1e4e8; font-size: 12px; color: #6a737d; text-align: center;">
            <p>此验证码将在 5 分钟内有效，请尽快完成验证。</p>
            <p>此邮件由证书监控系统自动发送，请勿回复。</p>
            <p>如果您没有请求此验证码，请忽略此邮件。</p>
          </div>
        </div>
      `
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('邮件发送失败:', error)
    return { success: false, error: '邮件发送失败，请稍后重试' }
  }
}
