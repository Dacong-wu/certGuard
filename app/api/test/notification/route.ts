import { NextResponse } from 'next/server'
import { addTestDomain } from '@/app/domains/actions'
import { sendCertificateExpiryEmail } from '@/lib/email'
import { calculateDaysLeft } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 添加测试域名
    const addResult = await addTestDomain(parseInt(userId))
    if (!addResult.success) {
      return NextResponse.json(
        { success: false, error: '添加测试域名失败' },
        { status: 500 }
      )
    }

    // 发送测试通知邮件
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const expiryDate = tomorrow.toISOString().split('T')[0]

    const sendResult = await sendCertificateExpiryEmail(
      email,
      'test.example.com',
      1,
      expiryDate
    )

    if (!sendResult.success) {
      return NextResponse.json(
        { success: false, error: '发送测试邮件失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '测试通知已发送'
    })
  } catch (error) {
    console.error('测试通知失败:', error)
    return NextResponse.json(
      { success: false, error: '测试通知失败' },
      { status: 500 }
    )
  }
} 