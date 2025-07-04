/**
 * 文件功能：Supabase服务端客户端配置
 * 包含的功能：服务端客户端（用于API路由和服务器组件）
 * 最后修改时间：2024-12-19
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

// 服务端客户端（用于服务器组件和API路由）
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // set方法在中间件中调用时可能会失败
            // 这在某些情况下是预期的行为
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // remove方法在中间件中调用时可能会失败
            // 这在某些情况下是预期的行为
          }
        },
      },
    }
  )
} 