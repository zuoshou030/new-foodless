/**
 * 文件功能：Supabase浏览器端客户端配置
 * 包含的功能：浏览器端客户端
 * 最后修改时间：2024-12-19
 */

import { createBrowserClient } from '@supabase/ssr'

// 浏览器端客户端
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 数据库类型（如果需要的话）
export type Database = {
  // 这里将来可以添加数据库类型定义
} 