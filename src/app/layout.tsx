/**
 * 文件功能：Next.js根布局组件
 * 包含的组件：RootLayout
 * 最后修改时间：2024-12-21
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CONFIG } from '@/config'
import { AuthProvider } from '@/components/auth/AuthProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: CONFIG.app.title,
  description: CONFIG.app.description,
  keywords: CONFIG.app.keywords,
  authors: [{ name: CONFIG.app.author }],
}

// 在Next.js 14中，viewport需要单独导出
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

/**
 * 根布局组件
 * @param children - 子组件内容
 * @returns JSX元素
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
        {/* 全局容器 */}
        <div id="root">
          {children}
        </div>
        </AuthProvider>
      </body>
    </html>
  )
} 