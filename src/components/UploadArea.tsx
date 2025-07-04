/**
 * 文件功能：上传区域组件
 * 包含的组件：UploadArea
 * 包含的功能：图片上传、拖拽上传、相机拍照
 * 最后修改时间：2024-12-19
 */

'use client'

import { useRef, useState, useCallback } from 'react'

interface UploadAreaProps {
  onImageUpload: (file: File) => void
  isUploaded?: boolean
  uploadedImageUrl?: string
}

/**
 * 上传区域组件
 * 支持图片上传、拖拽和相机拍照
 * @param onImageUpload - 图片上传回调函数
 * @param isUploaded - 是否已上传图片（用于显示反馈状态）
 * @param uploadedImageUrl - 上传图片的URL（用于预览）
 * @returns JSX元素
 */
export default function UploadArea({ onImageUpload, isUploaded = false, uploadedImageUrl }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  /**
   * 处理文件选择
   * @param files - 选择的文件列表
   */
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // 验证文件类型
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('请选择图片或视频文件')
      return
    }

    onImageUpload(file)
  }, [onImageUpload])

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  /**
   * 处理文件拖拽放置
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [handleFileSelect])

  /**
   * 触发文件选择
   */
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /**
   * 触发相机拍照
   */
  const triggerCamera = useCallback(() => {
    cameraInputRef.current?.click()
  }, [])

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }, [handleFileSelect])

  return (
    <div className="w-full max-w-md transition-all duration-700 fade-in">
      <div
        className={`main-card p-12 sm:p-16 text-center cursor-pointer mx-4 sm:mx-0 upload-area ${
          isDragging ? 'border-black bg-white' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <div className="relative z-10">
          {isUploaded ? (
            /* 上传成功状态 - 乔布斯风格的优雅设计 */
            <div className="flex flex-col items-center animate-in fade-in duration-700 slide-in-from-bottom-4">
              {/* 图片预览容器 */}
              <div className="relative mb-6 transform transition-all duration-500 ease-out scale-100 hover:scale-105 animate-in zoom-in duration-500 delay-100">
                {/* 图片预览 */}
                <div className="w-36 h-36 rounded-3xl overflow-hidden bg-gray-100 shadow-lg ring-1 ring-black/5">
                  {uploadedImageUrl ? (
                    <img 
                      src={uploadedImageUrl} 
                      alt="已上传图片" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                      <i className="fas fa-image text-2xl text-blue-300"></i>
                    </div>
                  )}
                </div>
                
                {/* iOS风格的成功徽章 */}
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white transform transition-all duration-300 ease-out animate-in zoom-in delay-300">
                  <i className="fas fa-check text-xs text-white drop-shadow-sm"></i>
                </div>
              </div>
              
              {/* 优雅的文字反馈 */}
              <h3 className="text-lg font-medium text-black mb-1 tracking-tight">
                迈出第一步啦！
              </h3>
              <p className="text-sm text-gray-500 font-light">
                轻触以重新选择
              </p>
            </div>
          ) : (
            /* 默认上传状态 */
            <>
              {/* 极简图标按钮布局 */}
              <div className="flex justify-center gap-8 mb-8">
                {/* 上传图片按钮 */}
                <div 
                  className="upload-icon-btn w-20 h-20 bg-white border-2 border-gray-300 rounded-2xl flex items-center justify-center cursor-pointer hover:border-black transition-all"
                  onClick={(e) => {
                    e.stopPropagation()
                    triggerFileSelect()
                  }}
                >
                  <i className="fas fa-image text-2xl text-gray-600"></i>
                </div>
                
                {/* 拍照按钮 */}
                <div 
                  className="camera-icon-btn w-20 h-20 bg-white border-2 border-gray-300 rounded-2xl flex items-center justify-center cursor-pointer hover:border-black transition-all"
                  onClick={(e) => {
                    e.stopPropagation()
                    triggerCamera()
                  }}
                >
                  <i className="fas fa-camera text-2xl text-gray-600"></i>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-black mb-2">
                {isDragging ? '释放文件以上传' : '上传食物照片'}
              </h3>
              <p className="text-sm text-gray-500">
                {isDragging ? '松开鼠标完成上传' : '点击图标选择文件或拖拽到此处'}
              </p>
            </>
          )}
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileInputChange}
        />
        
        {/* 隐藏的相机输入 */}
        <input
          ref={cameraInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
        />
      </div>
    </div>
  )
} 