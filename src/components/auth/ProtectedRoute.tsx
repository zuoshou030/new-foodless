/**
 * 文件功能：受保护路由组件
 * 包含的功能：认证状态检查、加载状态显示
 * 最后修改时间：2024-12-19
 */

'use client'

import { useAuth } from './AuthProvider'
import AuthLayout from './AuthLayout'
import LoadingOverlay from '../LoadingOverlay'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 受保护路由组件
 * 只有已登录用户才能访问子组件
 * @param children - 需要保护的子组件
 * @returns JSX元素
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4 animate-pulse">
            <i className="fas fa-leaf text-white text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            饭缩力
          </h2>
          <p className="text-gray-600">
            正在初始化...
          </p>
        </div>
      </div>
    )
  }

  // 用户未登录，显示认证页面
  if (!user) {
    return <AuthLayout />
  }

  // 用户已登录，显示受保护的内容
  return <>{children}</>
} 