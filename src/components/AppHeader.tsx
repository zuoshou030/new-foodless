/**
 * 文件功能：应用标题组件
 * 包含的组件：AppHeader
 * 包含的功能：显示应用标题、副标题、用户菜单
 * 最后修改时间：2024-12-19
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from './auth/AuthProvider'

/**
 * 应用标题组件
 * 显示饭缩力主标题、副标题和用户菜单
 * @param showTitle 是否显示标题区域（默认true）
 * @returns JSX元素
 */
export default function AppHeader({ showTitle = true }: { showTitle?: boolean }) {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  /**
   * 处理用户登出
   */
  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  return (
    <>
      {/* 用户菜单 - 固定在页面右上角 */}
      {user && (
        <div className="fixed top-4 right-4 z-50">
          <div className="relative">
            {/* 用户头像按钮 */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:border-gray-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <i className="fas fa-user text-gray-700"></i>
            </button>

            {/* 下拉菜单 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                {/* 用户信息 */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    饭缩力用户
                  </p>
                </div>

                {/* 菜单项 */}
                <div className="py-1">
                  <Link href="/mark?section=vow" passHref>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="fas fa-gem mr-2"></i>
                      核心誓言
                    </button>
                  </Link>
                  <Link href="/mark?section=log" passHref>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="fas fa-trophy mr-2"></i>
                      胜利回响
                    </button>
                  </Link>
                  <Link href="/mark?section=commitment" passHref>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="fas fa-bullseye mr-2"></i>
                      承诺之重
                    </button>
                  </Link>
                  <div className="border-t my-2"></div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 点击外部关闭菜单 */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* 应用标题 - 根据showTitle参数控制显示 */}
      {showTitle && (
        <div className="text-center mb-12 fade-in">
          <h1 className="text-5xl sm:text-6xl font-bold title-gradient mb-4">
            饭缩力
          </h1>
          <p className="text-xl text-gray-600 font-medium">让食物失去诱惑力</p>
          <div className="w-24 h-1 bg-black rounded-full mx-auto mt-4"></div>
        </div>
      )}
    </>
  )
} 