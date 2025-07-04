/**
 * 文件功能：加载动画覆盖层组件
 * 包含的组件：LoadingOverlay
 * 包含的功能：全屏警醒文字滚动刷新、加载动画
 * 最后修改时间：2024-12-19
 */

'use client'

import { useEffect, useState } from 'react'
import { CLIENT_CONFIG } from '@/config/client'

interface LoadingOverlayProps {
  message?: string
}

/**
 * 加载动画覆盖层组件
 * 显示全屏警醒文字滚动刷新和加载指示器
 * @param message - 自定义警醒文字（如果提供则使用固定文字，否则使用滚动警示文字）
 * @returns JSX元素
 */
export default function LoadingOverlay({ 
  message 
}: LoadingOverlayProps) {
  const [showText, setShowText] = useState(false)
  const [currentText, setCurrentText] = useState(CLIENT_CONFIG.ui.defaultLoadingText)
  const [warningTexts, setWarningTexts] = useState<string[]>([])
  const [availableTexts, setAvailableTexts] = useState<string[]>([])
  const [fadeClass, setFadeClass] = useState('')
  const [isFirstTextReady, setIsFirstTextReady] = useState(false) // 新增：跟踪第一个文字是否准备好

  // 🔒 备用警示文字（安全的通用文字，不含商业机密）
  const fallbackTexts = ['正在加载中...', '请稍等...', '系统处理中...']

  // 加载警示文字
  useEffect(() => {
    const loadWarningTexts = async () => {
      try {
        const response = await fetch('/api/warnings?type=warning&count=15')
        if (!response.ok) throw new Error('Failed to load texts')
        
        const data = await response.json()
        const texts = data.texts || fallbackTexts
        setWarningTexts(texts)
        setAvailableTexts([...texts])
        
        // 设置第一个文字
        if (texts.length > 0 && !message) {
          const firstIndex = Math.floor(Math.random() * texts.length)
          setCurrentText(texts[firstIndex])
          setAvailableTexts(prev => prev.filter((_, index) => index !== firstIndex))
          setIsFirstTextReady(true) // 标记第一个文字已准备好
        }
      } catch (error) {
        console.warn('加载警醒文字失败，使用备用文字:', error)
        setWarningTexts(fallbackTexts)
        setAvailableTexts([...fallbackTexts])
        
        if (!message) {
          const firstIndex = Math.floor(Math.random() * fallbackTexts.length)
          setCurrentText(fallbackTexts[firstIndex])
          setAvailableTexts(prev => prev.filter((_, index) => index !== firstIndex))
          setIsFirstTextReady(true) // 标记第一个文字已准备好
        }
      }
    }

    loadWarningTexts()
  }, [message])

  // 文字切换逻辑
  useEffect(() => {
    if (message) {
      // 如果提供了固定消息，则使用固定消息
      setCurrentText(message)
      setIsFirstTextReady(true)
      return
    }

    // 启动文字滚动
    const switchText = () => {
      setFadeClass('opacity-0') // 开始淡出
      
      setTimeout(() => {
        // 如果可用文字用完了，重新填充
        if (availableTexts.length === 0) {
          setAvailableTexts([...warningTexts])
        }
        
        if (availableTexts.length > 0) {
          // 随机选择一个文字
          const randomIndex = Math.floor(Math.random() * availableTexts.length)
          const nextText = availableTexts[randomIndex]
          
          setCurrentText(nextText)
          setAvailableTexts(prev => prev.filter((_, index) => index !== randomIndex))
        }
        
        setFadeClass('opacity-100') // 开始淡入
      }, CLIENT_CONFIG.ui.fadeAnimationDuration) // 等待淡出动画完成
    }

    // 只有在第一个文字准备好后才启动定时器
    if (!isFirstTextReady) return

    // 🔒 使用动态获取的时间间隔（从服务端获取商业策略）
    const interval = setInterval(switchText, 2300) // 临时使用固定值，待实现动态获取

    return () => {
      clearInterval(interval)
    }
  }, [message, warningTexts, availableTexts, isFirstTextReady])

  // 初始显示逻辑
  useEffect(() => {
    if (isFirstTextReady) {
      setTimeout(() => {
        setShowText(true)
        setFadeClass('opacity-100')
      }, 100)
    }
  }, [isFirstTextReady])

  useEffect(() => {
    // 锁定body滚动
    document.body.classList.add('loading-active')
    
    return () => {
      document.body.classList.remove('loading-active')
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 warning-loader">
      {/* 主要警醒文字 */}
      <div className={`warning-text-main ${showText ? 'show' : ''}`}>
        <div 
          className={`transition-opacity duration-300 ${fadeClass}`}
          style={{ minHeight: '2em' }}
        >
          {currentText}
        </div>
      </div>
      
      {/* 加载指示器 */}
      <div className="loading-indicator">
        <div className="loading-dots">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
        <div className="loading-text">饭缩力正在注入</div>
      </div>
    </div>
  )
} 