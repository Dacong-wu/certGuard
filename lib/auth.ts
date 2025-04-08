import { redirect } from 'next/navigation'

export async function requireAuth() {
  // 在客户端组件中，我们可以使用 localStorage 来存储用户信息
  const userId = localStorage.getItem('userId')

  if (!userId) {
    redirect('/login')
  }

  return { id: parseInt(userId) }
} 