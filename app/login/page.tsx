'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { requestVerificationCode } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await requestVerificationCode(email)
      console.log('Request result:', result)

      if (result.success) {
        toast.success('Event has been created', { description: result.message })
        setTimeout(() => {
          router.push(`/verify?email=${encodeURIComponent(email)}`)
        }, 1000)
      } else {
        setError(result.error || '发送验证码失败，请稍后重试')
        toast.error('发送失败', {
          description: result.error || '发送验证码失败，请稍后重试',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
      setError('发送验证码时发生错误，请稍后重试')
      toast.error('发送失败', {
        description: '发送验证码时发生错误，请稍后重试',
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME || '证书过期监控'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {process.env.NEXT_PUBLIC_APP_DESCRIPTION}
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '发送中...' : '发送验证码'}
          </Button>
        </form>
      </div>
    </div>
  )
}
