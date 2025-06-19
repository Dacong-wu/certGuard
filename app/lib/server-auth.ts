import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import db from '@/lib/db'
import { generateRandomCode } from '@/lib/utils'

// 会话有效期（24小时）
const SESSION_EXPIRY = 24 * 60 * 60 * 1000

// 生成验证码并保存到数据库
export async function generateVerificationCode(email: string) {
  // 生成6位数字验证码
  const code = generateRandomCode(6)

  // 设置过期时间（5分钟后）
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  // 删除该邮箱之前的验证码
  db.prepare('DELETE FROM verification_codes WHERE email = ?').run(email)

  // 保存新验证码
  db.prepare('INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)').run(email, code, expiresAt.toISOString())

  return code
}

// 验证验证码
export async function verifyCode(email: string, code: string) {
  // 查询验证码
  const verificationCode = db.prepare('SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > ?').get(email, code, new Date().toISOString())

  if (!verificationCode) {
    return false
  }

  // 验证成功后删除验证码
  db.prepare('DELETE FROM verification_codes WHERE email = ?').run(email)

  // 检查用户是否存在，不存在则创建
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as { id: number; email: string } | undefined

  if (!user) {
    const result = db.prepare('INSERT INTO users (email) VALUES (?)').run(email)
    user = { id: Number(result.lastInsertRowid), email }

    // 为新用户创建默认通知设置
    db.prepare('INSERT INTO notification_settings (user_id) VALUES (?)').run(user.id)
  }

  // 设置会话cookie
  const sessionId = crypto.randomUUID()
  const expires = new Date(Date.now() + SESSION_EXPIRY)

  const cookieStore = await cookies()
  cookieStore.set('session_id', sessionId, {
    expires,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  cookieStore.set('user_id', String(user.id), {
    expires,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  return true
}

// 获取当前登录用户
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) {
    return null
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  return user || null
}

// 检查用户是否已登录，未登录则重定向到登录页
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}
