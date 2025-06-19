import { sendEmail } from './transporter'
import { createVerificationCodeEmailTemplate } from './templates'

/**
 * 发送验证码邮件
 * @param to 收件人邮箱
 * @param code 验证码
 * @returns 发送结果
 */
export async function sendVerificationCode(
  to: string, 
  code: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log('开始发送验证码邮件:', { to, code })
  
  const subject = '证书监控系统验证码'
  const html = createVerificationCodeEmailTemplate(code)
  
  return await sendEmail(to, subject, html)
}