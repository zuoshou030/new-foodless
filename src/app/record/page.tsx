/**
 * 文件功能：记录结果页面
 * 包含的组件：RecordPage
 * 包含的功能：用户输入节食结果和感受
 * 最后修改时间：2024-07-31
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useFoodLessApp } from '@/hooks/useFoodLessApp'

/**
 * 记录结果页面
 * 提供一个文本框供用户输入本次节食的结果和感受。
 * @returns JSX元素
 */
export default function RecordPage() {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentConversations, setRecentConversations] = useState<any[]>([])
  const router = useRouter()
  const { session } = useAuth()
  const { appState } = useFoodLessApp()

  // 获取用户最近的对话历史作为上下文
  useEffect(() => {
    const fetchRecentConversations = async () => {
      if (!session?.access_token) return

      try {
        const response = await fetch('/api/recent-conversations?limit=20', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setRecentConversations(data.conversations || [])
          console.log('获取到最近对话:', data.conversations?.length || 0, '条')
        }
      } catch (error) {
        console.warn('获取最近对话失败:', error)
      }
    }

    fetchRecentConversations()
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('请输入您的感受')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 检查用户认证状态
      if (!session?.access_token) {
        throw new Error('用户未登录，请刷新页面重新登录')
      }

      // 构建对话历史上下文
      const conversationHistory = [
        // 包含当前应用状态中的对话
        ...appState.chatHistory,
        // 包含最近的数据库对话（转换格式）
        ...recentConversations.map(conv => ({
          type: conv.message_type,
          content: conv.content,
          timestamp: new Date(conv.created_at).getTime(),
          isNegative: conv.is_negative
        }))
      ].slice(-15) // 只取最近15条对话作为上下文，避免token过多

      console.log('记录分析上下文:', {
        appStateChatHistory: appState.chatHistory.length,
        recentConversations: recentConversations.length,
        totalContext: conversationHistory.length
      })

      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: 'recordAnalysis',
          userInput: content.trim(),
          weightLossReason: appState.weightLossReason || '健康生活',
          conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
          sessionId: appState.currentSessionId,
        }),
      })

      if (!response.ok) {
        throw new Error('分析请求失败')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // 将结果存储到sessionStorage中，然后跳转到结果页面
      sessionStorage.setItem('recordAnalysisResult', JSON.stringify({
        userContent: content.trim(),
        aiAnalysis: data.text,
        timestamp: Date.now()
      }))

      // 跳转到结果页面
      router.push('/record/result')

    } catch (error) {
      console.error('记录分析失败:', error)
      setError(error instanceof Error ? error.message : '分析失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      
      {/* 返回上一页的按钮 */}
      <div className="absolute top-8 left-8 z-10">
        <button
          onClick={() => router.back()}
          className="btn-secondary w-12 h-12 flex items-center justify-center text-gray-600 hover:text-black"
          disabled={isLoading}
        >
          <i className="fas fa-arrow-left text-lg"></i>
        </button>
      </div>
      
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">记录此刻</h1>
        <p className="text-lg text-gray-500 mb-8">无论是成功还是失败，记录下来都是一步。</p>

        <form onSubmit={handleSubmit} className="w-full">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天感觉怎么样？记录一下这次的感受吧..."
            className="w-full h-48 p-4 border-2 border-gray-200 rounded-2xl shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 ease-in-out text-base resize-none"
            required
            disabled={isLoading}
          />
          
          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full max-w-xs mt-6 px-8 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                AI分析中...
              </>
            ) : (
              '提交记录'
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 