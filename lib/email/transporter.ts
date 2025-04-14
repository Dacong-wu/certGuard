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

/**
 * 创建邮件传输器
 * 单例模式，确保只创建一个 transporter 实例
 */
let transporter: nodemailer.Transporter | null = null

export const getTransporter = () => {
  if (transporter) {
    return transporter
  }

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

  transporter = nodemailer.createTransport(config)
  return transporter
}

/**
 * 验证邮件配置
 * @returns {Promise<boolean>} 验证结果
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const mailer = getTransporter()
    await mailer.verify()
    console.log('邮件服务器配置验证成功')
    return true
  } catch (error) {
    console.error('邮件服务器配置验证失败:', error)
    return false
  }
}

/**
 * 发送通用邮件
 * @param to 收件人
 * @param subject 邮件主题
 * @param html 邮件HTML内容
 * @returns 发送结果
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const mailer = getTransporter()
    const info = await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com',
      to,
      subject,
      html,
    })

    console.log('邮件发送成功:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('邮件发送失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '邮件发送失败'
    }
  }
}