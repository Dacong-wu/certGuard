'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  ExternalLink,
  MoreHorizontal,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Search,
  Loader2,
  Pencil,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { deleteDomain } from '@/app/domains/actions'

interface Domain {
  id: number
  domain: string
  port: number
  status: string
  daysLeft: number
  cert_expiry_date: string
  notes?: string
}

interface DomainTableProps {
  domains: Domain[]
  showAll?: boolean
  userId: number
}

export function DomainTable({
  domains,
  showAll = false,
  userId
}: DomainTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 自动清除提示信息
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (error || success) {
      timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 3000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [error, success])

  const filteredDomains = domains.filter(domain =>
    domain.domain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string, daysLeft: number) => {
    switch (status) {
      case 'success':
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            <span>有效 ({daysLeft} 天)</span>
          </Badge>
        )
      case 'warning':
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>即将过期 ({daysLeft} 天)</span>
          </Badge>
        )
      case 'error':
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            <span>已过期 ({Math.abs(daysLeft)} 天)</span>
          </Badge>
        )
      default:
        return null
    }
  }

  const handleDeleteDomain = async () => {
    if (!domainToDelete) return

    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteDomain(userId, domainToDelete.id)
      if (result.success) {
        setSuccess('域名删除成功')
        // 触发父组件重新获取数据
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('domain-deleted'))
        }
      } else {
        setError(result.error || '删除域名失败')
      }
    } catch (error) {
      console.error('删除域名失败:', error)
      setError('删除域名失败，请稍后重试')
    } finally {
      setIsDeleting(false)
      setDomainToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索域名..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md">
          {success}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">域名</TableHead>
              <TableHead className="w-[80px]">端口</TableHead>
              <TableHead className="w-[140px]">状态</TableHead>
              <TableHead className="w-[100px]">过期时间</TableHead>
              {showAll && <TableHead className="w-[200px]">备注</TableHead>}
              <TableHead className="w-[80px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDomains.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showAll ? 6 : 5}
                  className="text-center"
                >
                  没有找到匹配的域名
                </TableCell>
              </TableRow>
            ) : (
              filteredDomains.map(domain => (
                <TableRow key={domain.id}>
                  <TableCell className="font-medium">{domain.domain}</TableCell>
                  <TableCell>{domain.port}</TableCell>
                  <TableCell>
                    {getStatusBadge(domain.status, domain.daysLeft)}
                  </TableCell>
                  <TableCell>
                    {new Date(domain.cert_expiry_date).toLocaleDateString()}
                  </TableCell>
                  {showAll && <TableCell>{domain.notes || '-'}</TableCell>}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `https://${domain.domain}:${domain.port}`,
                              '_blank'
                            )
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          访问域名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/domains/${domain.id}/edit`)
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          编辑域名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/domains/${domain.id}`)}
                        >
                          <Info className="mr-2 h-4 w-4" />
                          域名信息
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDomainToDelete(domain)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除域名
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!domainToDelete}
        onOpenChange={() => setDomainToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除域名 {domainToDelete?.domain} 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDomain}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
