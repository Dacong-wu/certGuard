'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getDomainById, updateDomain } from '../../actions'
import React from 'react'

interface DomainInfo {
  id: number
  domain: string
  port: number
  last_checked: string
  expiry_date: string
  status: string
  daysLeft: number
  notes: string
}

export default function EditDomainPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [domain, setDomain] = useState<DomainInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const resolvedParams = React.use(params)

  // 表单状态
  const [port, setPort] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadDomain() {
      try {
        const result = await getDomainById(parseInt(resolvedParams.id))
        if (result.success) {
          setDomain(result.domain)
          setPort(result.domain.port.toString())
          setNotes(result.domain.notes || '')
        } else {
          setError(result.error || '获取域名信息失败')
        }
      } catch (error) {
        setError('获取域名信息失败，请稍后重试')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDomain()
  }, [resolvedParams.id])

  const handleSave = async () => {
    if (!domain) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateDomain(domain.id, {
        port: parseInt(port),
        notes: notes.trim()
      })

      if (result.success) {
        setSuccess('域名信息已更新')
        setTimeout(() => {
          router.push(`/domains/${domain.id}`)
        }, 1500)
      } else {
        setError(result.error || '更新域名信息失败')
      }
    } catch (error) {
      setError('更新域名信息失败，请稍后重试')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              router.back()
              setTimeout(() => {
                if (window.location.pathname === `/domains/${domain?.id}/edit`) {
                  router.push('/?tab=domains')
                }
              }, 100)
            }}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/?tab=domains')}>返回域名列表</Button>
        </div>
      </div>
    )
  }

  if (!domain) {
    return (
      <div className="p-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              router.back()
              setTimeout(() => {
                if (window.location.pathname === `/domains/${domain?.id}/edit`) {
                  router.push('/?tab=domains')
                }
              }, 100)
            }}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">未找到域名信息</p>
          <Button onClick={() => router.push('/?tab=domains')}>返回域名列表</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            router.back()
            setTimeout(() => {
              if (window.location.pathname === `/domains/${domain.id}/edit`) {
                router.push('/?tab=domains')
              }
            }, 100)
          }}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">编辑域名</h1>

        <Card>
          <CardHeader>
            <CardTitle>{domain.domain}</CardTitle>
            <CardDescription>修改域名的端口和备注信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="port">端口</Label>
              <Input
                id="port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value.replace(/\D/g, ''))}
                placeholder="443"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加关于此域名的备注信息"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-500">
                {success}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push(`/domains/${domain.id}`)}
              disabled={isSaving}
            >
              返回
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? '保存中...' : '保存更改'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 