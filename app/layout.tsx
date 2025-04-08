import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from 'next'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || '证书过期监控',
  description: '专业的 SSL/TLS 证书监控系统，实时监控证书状态，及时提醒证书过期',
  keywords: 'SSL证书, TLS证书, 证书监控, 证书过期, 安全监控',
  openGraph: {
    title: process.env.NEXT_PUBLIC_APP_NAME || '证书过期监控',
    description: '专业的 SSL/TLS 证书监控系统，实时监控证书状态，及时提醒证书过期',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storageKey="certificate-monitor-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}