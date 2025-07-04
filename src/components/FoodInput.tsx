/**
 * 文件功能：减肥理由输入组件
 * 包含的组件：FoodInput
 * 包含的功能：文本输入、回车提交、输入验证
 * 最后修改时间：2024-12-19
 */

'use client'

import { useState, useCallback, KeyboardEvent } from 'react'

interface FoodInputProps {
  onSubmit: (reason: string) => void
}

/**
 * 减肥理由输入组件
 * 支持文本输入和回车提交
 * @param onSubmit - 提交回调函数
 * @returns JSX元素
 */
export default function FoodInput({ onSubmit }: FoodInputProps) {
  const [reason, setReason] = useState('')

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
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
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
    if (value.length <= 50) {
      setReason(value)
      
      // 实时提交（当输入有效时）
      if (value.trim().length >= 2) {
        onSubmit(value.trim())
      }
    }
  }, [onSubmit])

  return (
    <div className="w-full max-w-md fade-in px-4 sm:px-0">
      <div className="relative">
        <input
          type="text"
          value={reason}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="请输入你曾经想减肥的初心"
          className="food-input-field w-full"
          maxLength={50}
        />
      </div>
    </div>
  )
} 