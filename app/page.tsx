// app/page.tsx
import { Suspense } from 'react'
import DashboardPage from '@/components/dashboard-content'

export default function Page() {
  function DashboardSkeleton() {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    )
  }
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPage />
    </Suspense>
  )
}
