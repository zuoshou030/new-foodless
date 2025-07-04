/**
 * 文件功能：认证页面布局组件
 * 包含的功能：认证页面的整体布局、表单模式切换
 * 最后修改时间：2024-12-19
 */

'use client'

import { useState } from 'react'
import AuthForm from './AuthForm'

/**
 * 认证页面布局组件
 * 管理登录和注册表单的显示
 * @returns JSX元素
 */
export default function AuthLayout() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 应用Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4">
            <i className="fas fa-apple-alt text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            饭缩力
          </h1>
          <p className="text-gray-600">
            控制食欲，重塑自我
          </p>
        </div>

        {/* 认证表单 */}
        <AuthForm 
          mode={authMode} 
          onModeChange={setAuthMode} 
        />

        {/* 免责声明 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            继续使用即表示您同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  )
} 