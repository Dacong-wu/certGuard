"use server"

import { verifyCode as authVerifyCode, generateVerificationCode } from "@/app/lib/server-auth"
import { sendEmail } from "@/lib/utils"
import db from "@/lib/db"

interface VerifyResponse {
  success: boolean
  userId?: number
  email?: string
}

export async function verifyCode(email: string, code: string): Promise<VerifyResponse> {
  const isValid = await authVerifyCode(email, code)

  if (isValid) {
    // 从数据库获取用户信息
    const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(email)
    if (user) {
      return { success: true, userId: user.id, email: user.email }
    }
  }

  return { success: false }
}

export async function requestNewCode(email: string) {
  // 生成新验证码
  const code = await generateVerificationCode(email)

  // 发送验证码邮件
  await sendEmail(email, "证书监控系统登录验证码", `${code}`)

  return { success: true }
}

