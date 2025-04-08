import { NextResponse } from 'next/server'
import { sendCertificateExpiryEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      console.error('缺少邮箱地址')
      return NextResponse.json(
        { success: false, error: '缺少邮箱地址' },
        { status: 400 }
      )
    }

    console.log('开始发送测试邮件到:', email)

    // 发送测试通知邮件
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const expiryDate = tomorrow.toISOString().split('T')[0]

    console.log('测试邮件参数:', {
      email,
      domain: 'test.example.com',
      daysLeft: 1,
      expiryDate
    })

    const sendResult = await sendCertificateExpiryEmail(
      email,
      'test.example.com',
      1,
      expiryDate
    )

    if (!sendResult.success) {
      console.error('发送测试邮件失败:', sendResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: sendResult.error || '发送测试邮件失败',
          details: sendResult.error
        },
        { status: 500 }
      )
    }

    console.log('测试邮件发送成功')
    return NextResponse.json({
      success: true,
      message: '测试邮件已发送'
    })
  } catch (error) {
    console.error('发送测试邮件失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '发送测试邮件失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 