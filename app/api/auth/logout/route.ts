import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = cookies()
  
  // 删除会话相关的 cookie
  cookieStore.delete("session_id")
  cookieStore.delete("user_id")
  
  return NextResponse.json({ success: true })
} 