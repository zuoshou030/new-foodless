/**
 * 文件功能：减肥理由输入组件
 * 包含的组件：FoodInput
 * 包含的功能：文本输入、回车提交、输入验证
 * 最后修改时间：2024-12-19
 */

'use client'

import { useState, useCallback, KeyboardEvent, useRef, useEffect } from 'react'

interface FoodInputProps {
  onSubmit: (reason: string) => void
}

/**
 * 减肥理由输入组件
 * 支持多行文本输入，高度会根据内容自适应
 * @param onSubmit - 提交回调函数
 * @returns JSX元素
 */
export default function FoodInput({ onSubmit }: FoodInputProps) {
  const [reason, setReason] = useState('')
  const [isMultiLine, setIsMultiLine] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const singleRowHeightRef = useRef(0)

  // 自动调整textarea高度并判断是否为多行
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // 首次渲染时，记录下单行高度作为基准
      if (singleRowHeightRef.current === 0) {
        singleRowHeightRef.current = textarea.scrollHeight
      }

      // 重置高度以获取最新的滚动高度
      textarea.style.height = 'auto'
      const newScrollHeight = textarea.scrollHeight

      // 设置新的高度
      textarea.style.height = `${newScrollHeight}px`

      // 判断是否超过一行（增加2px容差以避免计算误差）
      setIsMultiLine(newScrollHeight > singleRowHeightRef.current + 2)
    }
  }, [reason])

  /**
   * 处理输入提交
   */
  const handleSubmit = useCallback(() => {
    const trimmedReason = reason.trim()
    
    if (!trimmedReason) {
      return // 静默处理，不弹出提示
    }

    if (trimmedReason.length < 2) {
      return // 静默处理，不弹出提示
    }

    onSubmit(trimmedReason)
    // 不清空输入框，保持用户输入
  }, [reason, onSubmit])

  /**
   * 处理键盘事件
   * @param e - 键盘事件
   */
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // 使用 Shift+Enter 换行
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  /**
   * 处理输入变化
   * @param e - 输入事件
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    // 限制输入长度
    if (value.length <= 200) {
      setReason(value)
    }
  }, [])

  return (
    <div className="w-full max-w-md fade-in px-4 sm:px-0">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={reason}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="请输入你曾经想减肥的初心"
          className={`food-input-field w-full ${isMultiLine ? 'text-left' : 'text-center'}`}
          maxLength={200}
          rows={1}
        />
      </div>
    </div>
  )
} 