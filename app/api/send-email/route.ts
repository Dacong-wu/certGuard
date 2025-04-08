import { NextResponse } from 'next/server'
import { sendMail } from '@/lib/email-config'

export async function POST(request: Request) {
  try {
    const { to, subject, content, isVerificationCode } = await request.json()
    const result = await sendMail(to, subject, content, isVerificationCode)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error('邮件发送失败:', error)
    return NextResponse.json(
      { success: false, error: '邮件发送失败，请稍后重试' },
      { status: 500 }
    )
  }
} 