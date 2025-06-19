// app/page.tsx
import { Suspense } from 'react'
import DashboardPage from '@/components/dashboard-content'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardPage />
    </Suspense>
  )
}
