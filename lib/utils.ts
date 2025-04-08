import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成指定长度的随机数字验证码
export function generateRandomCode(length: number): string {
  let code = ""
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

// 格式化日期
export function formatDate(date: Date | string): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toISOString().split("T")[0]
}

// 计算剩余天数
export function calculateDaysLeft(expiryDate: Date | string): number {
  if (!expiryDate) return 0
  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate
  const today = new Date()

  // 重置时间部分以确保准确计算天数
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)

  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 根据剩余天数确定状态
export function getStatusFromDaysLeft(daysLeft: number): "success" | "warning" | "error" {
  if (daysLeft < 0) return "error"
  if (daysLeft <= 30) return "warning"
  return "success"
}

// 发送邮件
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // 在服务器端使用端口，在客户端使用相对路径
    const port = typeof window === 'undefined' 
      ? process.env.PORT || '3000'
      : ''

    const response = await fetch(`${port ? `http://localhost:${port}` : ''}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        content: html,
        isVerificationCode: false,
      }),
    })

    if (!response.ok) {
      throw new Error('发送邮件失败')
    }

    return await response.json()
  } catch (error) {
    console.error('发送邮件失败:', error)
    throw error
  }
}

