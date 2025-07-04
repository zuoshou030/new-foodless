/**
 * 文件功能：记录分析结果页面
 * 包含的组件：RecordResultPage
 * 包含的功能：展示用户记录和AI分析结果
 * 最后修改时间：2024-08-01
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AnalysisResult {
  userContent: string
  aiAnalysis: string
  timestamp: number
}

/**
 * 记录分析结果页面
 * 以极简、和谐的iOS设计风格，展示用户的深度洞察报告。
 * @returns JSX元素
 */
export default function RecordResultPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedResult = sessionStorage.getItem('recordAnalysisResult')
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult))
      } catch (error) {
        console.error('解析结果数据失败:', error)
        router.push('/record')
      }
    } else {
      router.push('/record')
    }
  }, [router])

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="loading-dots">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* 顶部导航，类似iOS原生应用的风格 */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-full transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <h1 className="text-base font-semibold text-gray-800">深度洞察</h1>
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-full transition-colors"
            >
              <i className="fas fa-home"></i>
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="space-y-12">
          {/* Section: 您的记录 */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <i className="fas fa-user text-gray-500 text-sm"></i>
              </div>
              <h2 className="text-lg font-medium text-black">您的记录</h2>
            </div>
            <div className="pl-11">
              <p className="text-gray-800 text-base leading-relaxed">
                {result.userContent}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                {formatTimestamp(result.timestamp)}
              </p>
            </div>
          </section>

          {/* Section: AI 深度分析 */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <i className="fas fa-brain text-white text-sm"></i>
              </div>
              <h2 className="text-lg font-medium text-black">AI 深度分析</h2>
            </div>
            <div className="pl-11 markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.aiAnalysis}
              </ReactMarkdown>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="mt-16 space-y-4">
          <button
            onClick={() => router.push('/record')}
            className="w-full btn-primary h-14 text-base"
          >
            写新记录
          </button>
          <button
            onClick={() => alert('功能开发中...')}
            className="w-full btn-secondary h-12 text-sm"
          >
            保存这次分析
          </button>
        </div>
      </main>
    </div>
  )
} 