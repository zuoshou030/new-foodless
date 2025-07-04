/**
 * 文件功能：AI文字区域组件
 * 包含的组件：AITextArea
 * 包含的功能：AI文字显示、Markdown渲染、加载状态
 * 最后修改时间：2024-12-19
 */

'use client'

import { ChatMessage } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm' // 引入GFM插件以支持表格、删除线等

interface AITextAreaProps {
  messages: ChatMessage[]
  userQuestion?: ChatMessage
  currentType: 'negative' | 'positive'
}

/**
 * AI文字区域组件
 * 🔥 升级：使用react-markdown库替代不安全的dangerouslySetInnerHTML
 * @param messages - 聊天消息列表
 * @param userQuestion - 用户追问
 * @param currentType - 当前文字类型
 * @returns JSX元素
 */
export default function AITextArea({ messages, userQuestion, currentType }: AITextAreaProps) {
  
  // 如果没有消息，显示加载状态
  if (messages.length === 0 && !userQuestion) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mb-2"></div>
        <p>
          {currentType === 'negative' 
            ? '凝视图片，正在激发内心对话...' 
            : '正在生成激励文字...'
          }
        </p>
      </div>
    )
  }

  const hasFollowUp = !!userQuestion;
  const headerText = hasFollowUp ? '疑问回答' : (currentType === 'positive' ? '内心力量' : '理性分析');
  const headerIcon = hasFollowUp ? 'fa-comments' : (currentType === 'positive' ? 'fa-heart' : 'fa-brain');

  return (
    <div className="space-y-4">
      <div className="text-slide">
        <div 
          className={`text-area p-6 ${
            currentType === 'positive' ? 'motivating-text-style' : ''
          }`}
        >
          {/* 统一的标题 */}
          <div className="text-xs text-gray-500 mb-4 flex items-center">
            <i className={`fas ${headerIcon} mr-1.5`}></i>
            {headerText}
          </div>

          {/* 用户追问气泡（嵌套）- 一比一精确复刻 */}
          {userQuestion && (
            <div 
              className="mb-4"
              style={{
                backgroundColor: '#FFF7F7',
                border: '1px solid #e5e5e4', 
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'
              }}
            >
              <p 
                className="leading-relaxed"
                style={{
                  color: '#374151',
                  fontSize: '16px',
                  margin: 0,
                  fontWeight: '450'
                }}
              >
                {userQuestion.content}
              </p>
            </div>
          )}

          {/* AI消息内容 - 使用ReactMarkdown安全渲染 */}
          {messages.map(message => (
            <div 
              key={message.id} 
              className="prose prose-base prose-p:leading-relaxed max-w-none prose-hr:w-1/2 prose-hr:mx-auto prose-hr:my-6"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ))}

          {/* 当没有AI回复时的加载动画 */}
          {messages.length === 0 && userQuestion && (
            <div className="text-center text-gray-500 py-4">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 