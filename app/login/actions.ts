"use server"

import { generateVerificationCode } from "@/app/lib/server-auth"
import { sendEmail } from "@/lib/utils"
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function requestVerificationCode(email: string) {
  // 验证邮箱是否在允许列表中
  const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || []
  
  console.log('Allowed emails:', allowedEmails)
  console.log('Current email:', email)
  
  // 如果设置了允许的邮箱列表，但当前邮箱不在列表中
  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    console.log('Email not in allowed list')
    return {
      success: false,
      error: `邮箱 ${email} 不在允许的列表中。请联系管理员添加您的邮箱。`
    }
  }

  try {
    // 生成验证码
    const code = await generateVerificationCode(email)

    // 发送验证码邮件
    await sendEmail(email, "证书监控系统登录验证码", `${code}`)

    return { 
      success: true,
      message: `验证码已发送至 ${email}，请查收邮件。`
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    return {
      success: false,
      error: '发送验证码失败，请稍后重试。如果问题持续存在，请联系管理员。'
    }
  }
}

export async function login(email: string, password: string) {
  try {
    const user = await db.user.findUnique({
      where: {
        email,
        password // 注意：实际应用中应该使用加密后的密码进行比较
      }
    })

    if (!user) {
      return {
        success: false,
        error: '邮箱或密码错误'
      }
    }

    // 设置用户会话
    cookies().set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7天
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: '登录失败，请稍后重试'
    }
  }
}

