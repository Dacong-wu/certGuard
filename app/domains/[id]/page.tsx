'use client'

import type { DomainInfo } from '@/types'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDomainById } from '../actions'
import { Label } from '@/components/ui/label'
import { use } from 'react'

export default function DomainInfoPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [domain, setDomain] = useState<DomainInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const resolvedParams = use(params)

  useEffect(() => {
    async function loadDomain() {
      try {
        const result = await getDomainById(parseInt(resolvedParams.id))
        if (result.success) {
          setDomain(result.domain)
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
                if (window.location.pathname === `/domains/${domain?.id}`) {
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
          <Button onClick={() => router.push('/?tab=domains')}>返回</Button>
        </div>
      </div>
    )
  }

  if (!domain) {
    return (
      <div className="p-10">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">未找到域名信息</p>
          <Button onClick={() => router.push('/?tab=domains')}>返回</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/?tab=domains')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">域名信息</h1>

        <div className="grid gap-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>域名</Label>
                    <p className="text-sm">{domain.domain}</p>
                  </div>
                  <div>
                    <Label>端口</Label>
                    <p className="text-sm">{domain.port}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>状态</Label>
                    <div className="text-sm">
                      <Badge
                        className={`${
                          domain.status === 'success'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : domain.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}
                      >
                        {domain.status === 'success'
                          ? '正常'
                          : domain.status === 'warning'
                          ? '即将过期'
                          : '异常'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>剩余天数</Label>
                    <p className="text-sm">{domain.daysLeft} 天</p>
                  </div>
                </div>
                <div>
                  <Label>最后检查时间</Label>
                  <p className="text-sm">
                    {new Date(domain.last_checked).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 证书信息 */}
          <Card>
            <CardHeader>
              <CardTitle>证书信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      序列号
                    </label>
                    <div className="mt-1 text-sm text-gray-900 break-all font-mono">
                      {domain.cert_serial}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      颁发日期
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {domain.cert_issue_date
                        ? new Date(domain.cert_issue_date).toLocaleString()
                        : '未知'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      过期日期
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {domain.cert_expiry_date
                        ? new Date(domain.cert_expiry_date).toLocaleString()
                        : '未知'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      颁发机构
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {domain.issuer_organization}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      颁发国家
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {domain.issuer_country}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      颁发者名称
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {domain.issuer_common_name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SHA1 指纹
                    </label>
                    <div className="mt-1 text-sm text-gray-900 break-all font-mono">
                      {domain.cert_sha1_fingerprint}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SHA256 指纹
                    </label>
                    <div className="mt-1 text-sm text-gray-900 break-all font-mono">
                      {domain.cert_sha256_fingerprint}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>证书文件</Label>
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <pre className="text-xs font-mono break-all whitespace-pre-wrap">
                        {domain.cert_file
                          ? `-----BEGIN CERTIFICATE-----
${Buffer.from(domain.cert_file, 'base64')
  .toString('base64')
  .match(/.{1,64}/g)
  ?.join('\n')}
-----END CERTIFICATE-----`
                          : '无证书文件'}
                      </pre>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (domain.cert_file) {
                          const certContent = `-----BEGIN CERTIFICATE-----\n${Buffer.from(
                            domain.cert_file,
                            'base64'
                          )
                            .toString('base64')
                            .match(/.{1,64}/g)
                            ?.join('\n')}\n-----END CERTIFICATE-----`
                          const blob = new Blob([certContent], {
                            type: 'application/x-x509-ca-cert'
                          })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `${domain.domain}.cer`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }
                      }}
                    >
                      下载证书
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 备注信息 */}
          {domain.notes && (
            <Card>
              <CardHeader>
                <CardTitle>备注</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{domain.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/domains/${domain.id}/edit`)}
          >
            编辑
          </Button>
        </div>
      </div>
    </div>
  )
}
