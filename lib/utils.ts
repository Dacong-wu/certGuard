import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成指定长度的随机数字验证码
export function generateRandomCode(length: number): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

// 计算剩余天数
export function calculateDaysLeft(expiryDate: Date | string): number {
  if (!expiryDate) return 0
  const expiry =
    typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate
  const today = new Date()

  // 重置时间部分以确保准确计算天数
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)

  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 根据剩余天数确定状态
export function getStatusFromDaysLeft(
  daysLeft: number
): 'success' | 'warning' | 'error' {
  if (daysLeft < 0) return 'error'
  if (daysLeft <= 30) return 'warning'
  return 'success'
}
