'use server'

import {
  verifyCode as authVerifyCode,
  generateVerificationCode
} from '@/app/lib/server-auth'
import db from '@/lib/db'
import { sendVerificationCode } from '@/lib/email/index'

type VerifyResponse =
  | { success: true; userId: number; email: string }
  | { success: false }

export async function verifyCode(
  email: string,
  code: string
): Promise<VerifyResponse> {
  const isValid = await authVerifyCode(email, code)

  if (isValid) {
    // 从数据库获取用户信息
    const user = db
      .prepare('SELECT id, email FROM users WHERE email = ?')
      .get(email) as { id: number; email: string } | undefined
    if (user) {
      return { success: true, userId: user.id, email: user.email }
    }
  }

  return { success: false }
}

export async function requestNewCode(email: string) {
  // 生成新验证码
  const code = await generateVerificationCode(email)

  // 重新发送验证码邮件
  await sendVerificationCode(email, code)

  return { success: true }
}
