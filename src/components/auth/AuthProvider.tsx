/**
 * 文件功能：认证状态提供者
 * 包含的功能：用户状态管理、认证上下文
 * 最后修改时间：2024-12-19
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

// 认证上下文类型
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

// 认证提供者组件属性
interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * 认证状态提供者组件
 * 管理整个应用的用户认证状态
 * @param children - 子组件
 * @returns JSX元素
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 使用useState确保Supabase客户端只创建一次
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    // 获取初始会话
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('认证状态变化:', event, session?.user?.email) // 清理调试日志
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  /**
   * 用户登出
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('登出失败:', error.message)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 使用认证状态的Hook
 * @returns 认证状态对象
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用')
  }
  return context
} 