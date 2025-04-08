'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getNotificationSettings,
  updateNotificationSettings
} from '@/app/domains/actions'
import { useToast } from '@/components/ui/use-toast'

type NotificationSettingsProps = {
  userId: number
  userEmail: string
}

export function NotificationSettings({
  userId,
  userEmail
}: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { toast } = useToast()

  const [emailEnabled, setEmailEnabled] = useState(false)
  const [warningDays, setWarningDays] = useState('30')
  const [criticalDays, setCriticalDays] = useState('7')

  // 加载设置
  useEffect(() => {
    let isMounted = true

    async function loadSettings() {
      try {
        const result = await getNotificationSettings(userId)
        if (isMounted) {
          if (result.success && result.settings) {
            setEmailEnabled(!!result.settings.email_enabled)
            setWarningDays(String(result.settings.warning_days || 30))
            setCriticalDays(String(result.settings.critical_days || 7))
          } else if (result.success) {
            setEmailEnabled(false)
            setWarningDays('30')
            setCriticalDays('7')
            // 重置为默认值
            setEmailEnabled(false)
            setWarningDays('30')
            setCriticalDays('7')
          }
        }
      } catch (err) {
        console.error('加载通知设置失败:', err)
        setError('加载通知设置失败')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [userId])

  // 保存设置
  async function handleSaveSettings() {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateNotificationSettings(
        userId,
        emailEnabled,
        Number.parseInt(warningDays, 10),
        Number.parseInt(criticalDays, 10)
      )

      if (result.success) {
        setSuccess('通知设置已保存')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || '保存设置失败')
      }
    } catch (err) {
      console.error('保存通知设置失败:', err)
      setError('保存通知设置失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 发送测试邮件
  async function handleTestEmail() {
    if (!emailEnabled) {
      toast({
        title: '邮件通知未启用',
        description: '请先启用邮件通知功能',
        variant: 'destructive'
      })
      return
    }

    setIsTesting(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: '测试邮件已发送',
          description: '请检查您的邮箱'
        })
      } else {
        toast({
          title: '发送测试邮件失败',
          description: result.error || '请稍后重试',
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error('发送测试邮件失败:', err)
      toast({
        title: '发送测试邮件失败',
        description: '请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between py-4">
        <div>
          <h3 className="text-lg font-medium">邮件通知</h3>
          <p className="text-sm text-muted-foreground">
            当证书即将过期时通过邮件接收通知
          </p>
        </div>
        <Switch
          checked={emailEnabled}
          onCheckedChange={async checked => {
            setEmailEnabled(checked)
          }}
        />
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="warning-days">提前警告天数</Label>
            <Input
              id="warning-days"
              placeholder="30"
              type="number"
              value={warningDays}
              onChange={e => setWarningDays(e.target.value.replace(/\D/g, ''))}
              disabled={!emailEnabled}
            />
            <p className="text-xs text-muted-foreground">
              提前多少天开始发送警告通知
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="critical-days">紧急警告天数</Label>
            <Input
              id="critical-days"
              placeholder="7"
              type="number"
              value={criticalDays}
              onChange={e => setCriticalDays(e.target.value.replace(/\D/g, ''))}
              disabled={!emailEnabled}
            />
            <p className="text-xs text-muted-foreground">
              提前多少天开始发送紧急警告通知
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSaveSettings}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? '保存中...' : '保存邮件设置'}
          </Button>
          <Button
            variant="outline"
            onClick={handleTestEmail}
            disabled={!emailEnabled || isTesting}
          >
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isTesting ? '发送中...' : '发送测试邮件'}
          </Button>
        </div>
      </div>
    </div>
  )
}
