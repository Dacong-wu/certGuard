"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getMonthlyStats } from "@/app/domains/actions"

interface OverviewProps {
  userId: number
}

interface MonthlyStat {
  month: string
  warning: number
}

export function Overview({ userId }: OverviewProps) {
  const [stats, setStats] = useState<MonthlyStat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getMonthlyStats(userId)
        if (result.success) {
          setStats(result.stats)
        }
      } catch (error) {
        console.error("加载统计数据失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (stats.length === 0) {
    return (
      <div className="flex justify-center items-center h-[300px] text-muted-foreground">
        暂无即将过期的域名
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stats.map((stat) => {
        const [year, month] = stat.month.split('-')
        return (
          <div key={stat.month} className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">{year}年{month}月</span>
            <span className="text-sm text-warning">{stat.warning}个域名即将过期</span>
          </div>
        )
      })}
    </div>
  )
}

