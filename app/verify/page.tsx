"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { verifyCode, requestNewCode } from "./actions"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (!email) {
      router.push("/login")
    }

    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    } else {
      setCanResend(true)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown, email, router])

  async function handleVerify() {
    if (!code || code.length !== 6) {
      setError("请输入6位验证码")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await verifyCode(email, code)

      if (result.success) {
        localStorage.setItem('userId', result.userId.toString())
        localStorage.setItem('email', result.email || '')
        router.push("/")
      } else {
        setError("验证码无效或已过期")
      }
    } catch (err) {
      setError("验证失败，请稍后重试")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendCode() {
    setIsResending(true)
    setError(null)

    try {
      await requestNewCode(email)
      setCountdown(60)
      setCanResend(false)
    } catch (err) {
      setError("重新发送验证码失败")
      console.error(err)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">验证码</CardTitle>
          <CardDescription>我们已向 {email} 发送了验证码</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">验证码</Label>
            <Input
              id="code"
              placeholder="6位数字验证码"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={isLoading}
              maxLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={handleVerify} disabled={isLoading || code.length !== 6}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "验证中..." : "验证"}
          </Button>

          <Button variant="ghost" className="w-full" onClick={handleResendCode} disabled={isResending || !canResend}>
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isResending ? "发送中..." : canResend ? "重新发送验证码" : `${countdown}秒后可重新发送`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

