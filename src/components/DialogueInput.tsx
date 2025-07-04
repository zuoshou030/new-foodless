/**
 * 文件功能：对话输入组件
 * 包含的组件：DialogueInput
 * 包含的功能：用户输入、发送消息、加载状态
 * 最后修改时间：2024-12-19
 */

'use client'

import { useState, useCallback, KeyboardEvent } from 'react'

interface DialogueInputProps {
  onSubmit: (input: string) => void
}

/**
 * 对话输入组件
 * 允许用户输入想吃的理由，AI进行反驳
 * @param onSubmit - 提交回调函数
 * @returns JSX元素
 */
export default function DialogueInput({ onSubmit }: DialogueInputProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /**
   * 处理消息提交
   */
  const handleSubmit = useCallback(async () => {
    const trimmedInput = input.trim()
    
    if (!trimmedInput) {
      return
    }

    if (trimmedInput.length < 2) {
      alert('请输入至少2个字符')
      return
    }

    setIsLoading(true)
    
    try {
      await onSubmit(trimmedInput)
      setInput('') // 清空输入
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [input, onSubmit])

  /**
   * 处理键盘事件
   * @param e - 键盘事件
   */
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  /**
   * 处理输入变化
   * @param e - 输入事件
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // 限制输入长度
    if (value.length <= 200) {
      setInput(value)
    }
  }, [])

  return (
    <div className={`dialogue-input-wrapper ${isLoading ? 'loading' : ''}`}>
      {!isLoading ? (
        <>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="仍旧还想吃？写下你的理由"
            className="dialogue-input"
            maxLength={200}
            disabled={isLoading}
          />
          
          {input.trim() && (
            <button
              onClick={handleSubmit}
              className="send-btn"
              disabled={isLoading}
            >
              <i className="fas fa-arrow-up"></i>
            </button>
          )}
        </>
      ) : null}
      
      {/* 输入提示 */}
      {!isLoading && input.length > 0 && (
        <div className="absolute -bottom-6 left-4 text-xs text-gray-400">
          {input.length}/200 字符
        </div>
      )}
    </div>
  )
} 