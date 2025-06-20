'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { exportDomains, importDomains } from '@/app/domains/actions'
import { Download, Upload, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
}

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isImporting, setIsImporting] = useState(false)
  const router = useRouter()

  const handleExport = async () => {
    try {
      const result = await exportDomains(user.id)
      if (result.success && result.data) {
        // 创建 Blob 对象
        const blob = new Blob([result.data], {
          type: 'text/csv;charset=utf-8;'
        })
        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `domains_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success('导出成功', {
          description: '域名数据已成功导出为 CSV 文件'
        })
      } else {
        toast.error('导出失败', {
          description: result.error || '导出域名数据失败'
        })
      }
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败', {
        description: '导出域名数据时发生错误'
      })
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return

    const file = event.target.files[0]
    const reader = new FileReader()

    reader.onload = async e => {
      try {
        setIsImporting(true)
        const csvData = e.target?.result as string
        const result = await importDomains(user.id, csvData)

        if (result.success) {
          // 触发重新加载数据
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('domains-imported'))
          }

          toast.success('导入成功', {
            description: result.message
          })
        } else {
          toast.error('导入失败', {
            description: result.error || '导入域名数据失败'
          })
        }
      } catch (error) {
        console.error('导入失败:', error)
        toast.error('导入失败', {
          description: '导入域名数据时发生错误'
        })
      } finally {
        setIsImporting(false)
      }
    }

    reader.readAsText(file)
  }

  const handleLogout = () => {
    localStorage.removeItem('userId') // 清除客户端缓存
    localStorage.removeItem('email')
    router.push('/loginout') // 重定向到登录页
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME || '证书过期监控'}
          </h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            导出数据
          </Button>
          <Button
            variant="outline"
            asChild
            disabled={isImporting}
          >
            <label htmlFor="import-file">
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? '导入中...' : '导入数据'}
              <input
                id="import-file"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
                disabled={isImporting}
              />
            </label>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="flex flex-col items-start">
                <span className="text-sm font-medium">{user.email}</span>
                <span className="text-xs text-muted-foreground">
                  用户 ID: {user.id}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
