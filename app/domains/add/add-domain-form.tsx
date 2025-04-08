'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { addDomain, addDomainsBulk } from '../actions'

interface AddDomainFormProps {
  userId: number
}

export function AddDomainForm({ userId }: AddDomainFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 单个域名表单
  const [domain, setDomain] = useState('')
  const [port, setPort] = useState('443')
  const [notes, setNotes] = useState('')

  // 批量域名表单
  const [domains, setDomains] = useState('')

  // 处理添加单个域名
  async function handleAddDomain() {
    if (!domain) {
      setError('请输入域名')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await addDomain(userId, domain, Number.parseInt(port, 10), notes)

      if (result.success) {
        setSuccess('域名添加成功')
        // 清空表单
        setDomain('')
        setPort('443')
        setNotes('')
        // 延迟跳转
        setTimeout(() => router.push('/?tab=domains'), 1500)
      } else {
        setError(result.error || '添加域名失败')
      }
    } catch (err) {
      setError('添加域名失败，请稍后重试')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理批量添加域名
  async function handleAddDomainsBulk() {
    if (!domains) {
      setError('请输入域名列表')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await addDomainsBulk(userId, domains)

      if (result.success) {
        setSuccess(`成功添加 ${result.added} 个域名${result.failed > 0 ? `，${result.failed} 个域名添加失败` : ''}`)
        // 清空表单
        setDomains('')
        // 延迟跳转
        setTimeout(() => router.push('/?tab=domains'), 1500)
      } else {
        setError(result.error || '批量添加域名失败')
      }
    } catch (err) {
      setError('批量添加域名失败，请稍后重试')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 检查域名格式
  function handleCheck() {
    setIsChecking(true)
    setError(null)

    // 模拟检查过程
    setTimeout(() => {
      const domainList = domains.split('\n').filter(d => d.trim())

      if (domainList.length === 0) {
        setError('请输入至少一个域名')
      } else {
        const invalidDomains = domainList.filter(d => {
          const parts = d.includes(':') ? d.split(':')[0].trim() : d.trim()
          return !parts.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/)
        })

        if (invalidDomains.length > 0) {
          setError(`以下域名格式可能不正确: ${invalidDomains.join(', ')}`)
        } else {
          setSuccess('所有域名格式正确')
          setTimeout(() => setSuccess(null), 3000)
        }
      }

      setIsChecking(false)
    }, 1000)
  }

  return (
    <div className="p-10 ">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            router.back()
            setTimeout(() => {
              if (window.location.pathname === '/domains/add') {
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

      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">添加域名</h1>

        {error && (
          <Alert
            variant="destructive"
            className="mb-4"
          >
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
            <AlertTitle>成功</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs
          defaultValue="single"
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">单个域名</TabsTrigger>
            <TabsTrigger value="bulk">批量添加</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>添加单个域名</CardTitle>
                <CardDescription>输入要监控的域名，系统将自动检查其SSL证书状态</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="domain">域名</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">无需添加 https:// 或 http:// 前缀</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="port">端口</Label>
                  <Input
                    id="port"
                    placeholder="443"
                    value={port}
                    onChange={e => setPort(e.target.value.replace(/\D/g, ''))}
                    type="number"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">默认为 443 端口</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">备注 (可选)</Label>
                  <Textarea
                    id="notes"
                    placeholder="添加关于此域名的备注信息"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleAddDomain}
                  disabled={isLoading || !domain}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? '添加中...' : '添加域名'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>批量添加域名</CardTitle>
                <CardDescription>每行输入一个域名，系统将批量检查这些域名的SSL证书状态</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="domains">域名列表</Label>
                  <Textarea
                    id="domains"
                    placeholder="example.com:443&#10;example.org:8443&#10;example.net"
                    className="min-h-[150px]"
                    value={domains}
                    onChange={e => setDomains(e.target.value)}
                    disabled={isLoading || isChecking}
                  />
                  <p className="text-xs text-muted-foreground">每行一个域名，可选添加端口号（格式：域名:端口），不指定端口时默认为443</p>
                </div>

                <Alert>
                  <AlertTitle>提示</AlertTitle>
                  <AlertDescription>批量添加前，建议先点击"检查域名"按钮验证域名格式是否正确</AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleCheck}
                  disabled={isChecking || isLoading || !domains.trim()}
                >
                  {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isChecking ? '检查中...' : '检查域名'}
                </Button>
                <Button
                  onClick={handleAddDomainsBulk}
                  disabled={isLoading || !domains.trim()}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? '添加中...' : '批量添加'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 