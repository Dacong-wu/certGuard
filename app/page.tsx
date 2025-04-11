'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DomainTable } from '@/components/domain-table'
import { DashboardHeader } from '@/components/dashboard-header'
import { NotificationSettings } from '@/components/notification-settings'
import { getDomains, getDomainStats } from './domains/actions'
import type { DomainInfo } from '@/types'

interface DomainStats {
  total: number
  warning: number
  error: number
  success: number
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [domains, setDomains] = useState<DomainInfo[]>([])
  const [stats, setStats] = useState<DomainStats | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  useEffect(() => {
    // 检查用户是否已登录
    const storedUserId = localStorage.getItem('userId')
    const storedEmail = localStorage.getItem('email')
    if (!storedUserId) {
      router.push('/login')
      return
    }
    const parsedUserId = parseInt(storedUserId)
    setUserId(parsedUserId)
    setUserEmail(storedEmail || '')

    async function loadData() {
      const result = await getDomains(parsedUserId)
      if (result.success) {
        setDomains(result.domains)
      }

      const statsResult = await getDomainStats(parsedUserId)
      if (statsResult.isSuccess) {
        setStats({
          total: statsResult.total,
          warning: statsResult.warning,
          error: statsResult.error,
          success: statsResult.success
        })
      }
    }

    loadData()

    // 添加域名删除和导入事件监听器
    const handleDomainDeleted = () => {
      loadData()
    }

    const handleDomainsImported = () => {
      loadData()
    }

    window.addEventListener('domain-deleted', handleDomainDeleted)
    window.addEventListener('domains-imported', handleDomainsImported)

    return () => {
      window.removeEventListener('domain-deleted', handleDomainDeleted)
      window.removeEventListener('domains-imported', handleDomainsImported)
    }
  }, [router])

  // 当 tab 改变时更新 URL
  const handleTabChange = (value: string) => {
    router.push(`?tab=${value}`)
  }

  if (!userId) {
    return null
  }

  // 获取即将过期的域名
  const expiringDomains = domains.filter(
    domain => domain.status === 'warning' || domain.status === 'error'
  )

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={{ id: userId, email: userEmail }} />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {process.env.NEXT_PUBLIC_APP_NAME || '证书过期监控'}
          </h2>
          <Link href="/domains/add">
            <Button>添加域名</Button>
          </Link>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="domains">域名列表</TabsTrigger>
            <TabsTrigger value="notifications">邮件通知</TabsTrigger>
          </TabsList>
          <TabsContent
            value="overview"
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    监控域名总数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    即将过期
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">
                    {stats?.warning}
                  </div>
                  <p className="text-xs text-muted-foreground">30天内过期</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">已过期</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {stats?.error}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    健康状态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {stats?.success}
                  </div>
                  <p className="text-xs text-muted-foreground">证书有效</p>
                </CardContent>
              </Card>
            </div>
            {expiringDomains.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>近期过期域名</CardTitle>
                  <CardDescription>
                    以下域名将在30天内过期，请及时更新证书
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DomainTable
                    domains={expiringDomains}
                    userId={userId}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>近期过期域名</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">暂无即将过期的域名</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent
            value="domains"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>所有域名</CardTitle>
                <CardDescription>
                  管理所有监控的域名及其证书状态
                </CardDescription>
              </CardHeader>
              <CardContent>
                {domains.length > 0 ? (
                  <DomainTable
                    showAll={true}
                    domains={domains}
                    userId={userId}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      您还没有添加任何域名
                    </p>
                    <Link href="/domains/add">
                      <Button>添加域名</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent
            value="notifications"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
                <CardDescription>配置证书过期提醒通知</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSettings
                  userId={userId}
                  userEmail={userEmail}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
