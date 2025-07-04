/**
 * 文件功能：认证表单组件
 * 包含的功能：登录、注册、表单验证
 * 最后修改时间：2024-12-19
 */

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onModeChange: (mode: 'login' | 'signup') => void
}

/**
 * 认证表单组件
 * 支持用户登录和注册
 * @param mode - 表单模式（登录或注册）
 * @param onModeChange - 模式切换回调
 * @returns JSX元素
 */
export default function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signup') {
        // 注册
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        } else {
          setMessage('注册成功！请检查邮箱确认链接。')
        }
      } else {
        // 登录
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        }
      }
    } catch (err) {
      setError('发生未知错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理邮箱输入变化
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setError(null)
  }

  /**
   * 处理密码输入变化
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setError(null)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="main-card p-8">
        {/* 表单标题 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {mode === 'login' ? '欢迎回来' : '加入饭缩力'}
          </h2>
          <p className="text-gray-600">
            {mode === 'login' 
              ? '继续你的减肥之旅' 
              : '开始你的健康生活'}
          </p>
        </div>

        {/* 认证表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 邮箱输入 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="请输入邮箱地址"
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
              disabled={loading}
            />
          </div>

          {/* 密码输入 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder={mode === 'signup' ? '设置密码（至少6位）' : '请输入密码'}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {/* 错误消息 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 成功消息 */}
          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
              {message}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {mode === 'login' ? '登录中...' : '注册中...'}
              </span>
            ) : (
              mode === 'login' ? '登录' : '注册'
            )}
          </button>
        </form>

        {/* 模式切换 */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
              className="ml-1 text-black font-medium hover:underline focus:outline-none"
              disabled={loading}
            >
              {mode === 'login' ? '立即注册' : '立即登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
} 