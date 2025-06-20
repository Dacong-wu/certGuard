// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value // 或从 header/session 中获取登录状态
  const { pathname } = request.nextUrl

  // 🚫 未登录跳转到 /login（但不是 /login 本身，避免死循环）
  if (pathname !== '/login' && !userId) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // ✅ 已登录访问 /login，跳转到主页 /
  if (pathname === '/login' && userId) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    return NextResponse.redirect(homeUrl)
  }

  if (pathname === '/loginout') {
    // 清除登录状态
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('user_id') // 清除 cookie 中的 user_id
    return response
  }
  // 其他情况，放行
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/domains/:path*', '/login', '/loginout']
}
