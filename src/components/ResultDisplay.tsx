/**
 * 文件功能：结果展示组件
 * 包含的组件：ResultDisplay
 * 包含的功能：图片预览、AI文字展示、文字切换、对话输入
 * 最后修改时间：2024-12-19
 */

'use client'

import { useState, useCallback } from 'react'
import { ImageProcessResult, ChatMessage } from '@/types'
import AITextArea from './AITextArea'
import DialogueInput from './DialogueInput'
import Link from 'next/link'

interface ResultDisplayProps {
  processedImage: ImageProcessResult | null
  chatHistory: ChatMessage[]
  onBack: () => void
  onContinueDialogue: (input: string) => void
  onGenerateMotivating: () => void
}

/**
 * 结果展示组件
 * 显示处理后的图片和AI生成的文字内容
 * @param props - 组件属性
 * @returns JSX元素
 */
export default function ResultDisplay({
  processedImage,
  chatHistory,
  onBack,
  onContinueDialogue,
  onGenerateMotivating
}: ResultDisplayProps) {
  const [currentTextType, setCurrentTextType] = useState<'negative' | 'positive'>('negative')
  const [showMotivating, setShowMotivating] = useState(false)

  const lastUserMessage = [...chatHistory].reverse().find(m => m.type === 'user');

  /**
   * 切换到激励文字
   */
  const handleShowMotivating = useCallback(() => {
    if (!showMotivating) {
      onGenerateMotivating()
      setShowMotivating(true)
    }
    setCurrentTextType('positive')
  }, [showMotivating, onGenerateMotivating])

  /**
   * 切换回负面文字
   */
  const handleShowNegative = useCallback(() => {
    setCurrentTextType('negative')
  }, [])

  // 获取当前显示类型的消息
  const messagesForCurrentType = chatHistory.filter(msg => 
    currentTextType === 'negative' ? msg.isNegative !== false : msg.isNegative === false
  )
  
  const lastAiMessageForCurrentType = [...messagesForCurrentType].reverse().find(m => m.type === 'ai');

  let messagesToRenderInAiArea: ChatMessage[];
    
  // 仅在"负面/分析"视图下传递用户问题
  const userQuestionToShow = currentTextType === 'negative' ? lastUserMessage : undefined;

  if (lastUserMessage && currentTextType === 'negative') {
      // 对话模式: 只显示当前类型的最后一条AI消息
      messagesToRenderInAiArea = lastAiMessageForCurrentType ? [lastAiMessageForCurrentType] : [];
  } else {
      // 初始状态: 显示当前类型的所有初始消息
      messagesToRenderInAiArea = messagesForCurrentType;
  }

  return (
    <div className="w-full max-w-4xl transition-opacity duration-700 opacity-100 result-display relative">
      {/* 返回按钮 */}
      <div className="absolute -top-4 -left-4 z-20">
        <button 
          onClick={onBack}
          className="btn-secondary w-12 h-12 flex items-center justify-center text-gray-600 hover:text-black"
        >
          <i className="fas fa-arrow-left text-lg"></i>
        </button>
      </div>
      
      {/* 处理结果网格布局 */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* 图片预览区域 */}
        {processedImage && (
          <div className="result-card p-6">
            <h4 className="text-xl font-semibold mb-6 text-gray-800 text-center">
              饭缩力效果
            </h4>
            <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-inner">
              <img
                src={processedImage.processedImageUrl}
                alt="处理后的食物图片"
                className="w-full h-auto object-cover max-h-[500px]"
              />
            </div>
          </div>
        )}

        {/* AI文字区域 */}
        <div className={`result-card p-6 ${!processedImage ? 'lg:col-span-2' : ''}`}>
          <h4 className="text-xl font-semibold mb-6 text-gray-800 text-center">
            内心对话
          </h4>
          
          {/* AI文字内容区域 */}
          <AITextArea
            messages={messagesToRenderInAiArea}
            userQuestion={userQuestionToShow}
            currentType={currentTextType}
          />

          {/* 文字类型切换按钮 */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {currentTextType === 'negative' ? (
              <button 
                onClick={handleShowMotivating}
                className="btn-primary px-8 py-3 text-sm font-semibold"
              >
                <i className="fas fa-heart mr-2"></i>
                看到坚持的力量
              </button>
            ) : (
              <button 
                onClick={handleShowNegative}
                className="btn-primary btn-golden px-8 py-3 text-sm font-semibold"
              >
                <i className="fas fa-heart mr-2"></i>
                直面内心的诱惑
              </button>
            )}
            <Link href="/record">
              <button className="btn-primary px-8 py-3 text-sm font-semibold">
                <i className="fas fa-pencil-alt mr-2"></i>
                记录本次结果
              </button>
            </Link>
          </div>
          
          {/* 对话输入区域 */}
          <div className="mt-8">
            <DialogueInput onSubmit={onContinueDialogue} />
          </div>
        </div>
      </div>
    </div>
  )
} 