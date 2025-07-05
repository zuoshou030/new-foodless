/**
 * 文件功能：饭缩力主应用组件（UI视图层）
 * 包含的组件：FoodLessApp
 * 包含的功能：作为主应用的UI入口，渲染不同阶段的视图
 * 最后修改时间：2024-12-21
 */

'use client'

import { useFoodLessApp } from '@/hooks/useFoodLessApp'

import LoadingOverlay from './LoadingOverlay'
import AppHeader from './AppHeader'
import UploadArea from './UploadArea'
import FoodInput from './FoodInput'
import ResultDisplay from './ResultDisplay'

/**
 * 饭缩力主应用组件
 * 纯UI层，负责根据从useFoodLessApp Hook获取的状态来渲染界面
 * @returns JSX元素
 */
export default function FoodLessApp() {
  const {
    appState,
    migrationState,
    setMigrationState,
    canvasRef,
    videoRef,
    handleImageUpload,
    handleReasonSubmit,
    handleInjectPower,
    handleContinueDialogue,
    generateMotivatingText,
    handleBack,
    handleResume,
  } = useFoodLessApp();

  return (
    <>
      {/* 加载动画覆盖层 */}
      {(appState.isLoading || migrationState.isMigrating) && <LoadingOverlay />}
      
      {/* 数据迁移状态提示 */}
      {migrationState.isChecking && (
        <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded z-50">
          正在检查本地数据...
        </div>
      )}
      
      {migrationState.migrationError && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          迁移失败: {migrationState.migrationError}
          <button 
            onClick={() => setMigrationState(prev => ({ ...prev, migrationError: undefined }))}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="min-h-screen flex flex-col items-center justify-center p-6 stable-scrollbar">
        
        {/* 输入阶段 */}
        {appState.currentStep === 'input' && (
          <>
            {/* 返回会话窗口按钮 - 仅当有结果时显示 */}
            <AppHeader showBack={!!appState.processedImage} onBack={handleResume}/>
            
            {/* 上传图片区域 */}
            <UploadArea 
              onImageUpload={handleImageUpload} 
              isUploaded={!!appState.uploadedImage}
              uploadedImageUrl={appState.processedImage?.originalImageUrl}
            />
            
            {/* 分隔符 */}
            <div className="text-center my-4 fade-in separator-or">
              <span className="text-sm text-gray-400 bg-white px-3">然后</span>
            </div>
            
            <FoodInput onSubmit={handleReasonSubmit} />

            {/* 注入饭缩力按钮 - 只在图片和理由都准备好时显示 */}
            {appState.uploadedImage && appState.weightLossReason && appState.processedImage && (
              <div className="mt-6 fade-in">
                <button
                  onClick={handleInjectPower}
                  className="bg-black text-white px-16 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 min-w-[200px]"
                >
                  注入饭缩力
                </button>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-4 text-center fade-in">
              点进这个网站，你就已经向前了一大步
            </p>
          </>
        )}

        {/* 结果展示阶段 */}
        {appState.currentStep === 'result' && (
          <>
            <AppHeader showTitle={false} showBack={true} onBack={handleBack}/>
            <ResultDisplay
              processedImage={appState.processedImage}
              chatHistory={appState.chatHistory}
              onContinueDialogue={handleContinueDialogue}
              onGenerateMotivating={generateMotivatingText}
            />
          </>
        )}

        {/* 错误显示 */}
        {appState.error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {appState.error}
          </div>
        )}

        {/* 隐藏的canvas元素用于图像处理 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <video ref={videoRef} style={{ display: 'none' }} />
      </div>
    </>
  )
} 