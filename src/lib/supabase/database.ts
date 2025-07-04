/**
 * 文件功能：数据库操作统一接口
 * 包含的功能：用户资料、会话、对话、统计数据的CRUD操作
 * 最后修改时间：2024-12-19
 */

import { createClient } from './client'
import type { User } from '@supabase/supabase-js'

// 数据类型定义
export interface UserProfile {
  id: string
  email: string | null
  display_name: string | null
  weight_loss_goal: string | null
  current_weight: number | null
  target_weight: number | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  weight_loss_reason: string
  original_image_url: string | null
  processed_image_url: string | null
  created_at: string
  metadata: Record<string, any>
}

export interface Conversation {
  id: string
  session_id: string
  message_type: 'user' | 'ai'
  content: string
  is_negative: boolean
  created_at: string
  metadata: Record<string, any>
}

export interface UserStats {
  user_id: string
  total_sessions: number
  total_conversations: number
  last_active_at: string
  additional_stats: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UserVow {
  id: string
  user_id: string
  vow_text: string
  image_url: string | null
  motivational_text: string | null
  ai_motivational_text: string | null
  created_at: string
  updated_at: string
}

/**
 * 数据库操作类
 */
export class DatabaseService {
  private supabase = createClient()

  // ============= 用户资料相关 =============

  /**
   * 获取用户资料
   * @param userId - 用户ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle() // 使用maybeSingle而不是single，避免没有数据时报错

    if (error) {
      console.error('获取用户资料失败:', error)
      return null
    }

    // 如果没有资料，自动创建一个
    if (!data) {
      console.log('用户资料不存在，创建新资料:', userId)
      return this.createUserProfile(userId)
    }

    return data
  }

  /**
   * 创建用户资料
   * @param userId - 用户ID
   */
  async createUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email: null,
        display_name: null,
        weight_loss_goal: null,
        current_weight: null,
        target_weight: null
      })
      .select()
      .single()

    if (error) {
      console.error('创建用户资料失败:', error)
      return null
    }

    return data
  }

  /**
   * 更新用户资料
   * @param userId - 用户ID
   * @param updates - 更新的字段
   */
  async updateUserProfile(
    userId: string, 
    updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('更新用户资料失败:', error)
      return null
    }

    return data
  }

  // ============= 会话相关 =============

  /**
   * 创建新会话
   * @param userId - 用户ID
   * @param weightLossReason - 减肥理由
   * @param originalImageUrl - 原始图片URL
   * @param processedImageUrl - 处理后图片URL
   */
  async createSession(
    userId: string,
    weightLossReason: string,
    originalImageUrl?: string,
    processedImageUrl?: string
  ): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        user_id: userId,
        weight_loss_reason: weightLossReason,
        original_image_url: originalImageUrl || null,
        processed_image_url: processedImageUrl || null,
        metadata: {}
      })
      .select()
      .single()

    if (error) {
      console.error('创建会话失败:', error)
      return null
    }

    return data
  }

  /**
   * 获取用户的会话列表
   * @param userId - 用户ID
   * @param limit - 限制数量
   * @param offset - 偏移量
   */
  async getUserSessions(
    userId: string, 
    limit = 20, 
    offset = 0
  ): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取用户会话失败:', error)
      return []
    }

    return data || []
  }

  /**
   * 获取特定会话
   * @param sessionId - 会话ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('获取会话失败:', error)
      return null
    }

    return data
  }

  // ============= 对话相关 =============

  /**
   * 创建新对话
   * @param sessionId - 会话ID
   * @param messageType - 消息类型
   * @param content - 消息内容
   * @param isNegative - 是否为负面消息
   */
  async createConversation(
    sessionId: string,
    messageType: 'user' | 'ai',
    content: string,
    isNegative = true
  ): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
        message_type: messageType,
        content: content,
        is_negative: isNegative,
        metadata: {}
      })
      .select()
      .single()

    if (error) {
      console.error('创建对话失败:', error)
      return null
    }

    return data
  }

  /**
   * 获取会话的对话列表
   * @param sessionId - 会话ID
   */
  async getConversations(sessionId: string): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('获取对话列表失败:', error)
      return []
    }

    return data || []
  }

  /**
   * 获取用户的最近对话
   * @param userId - 用户ID
   * @param limit - 限制数量
   */
  async getUserRecentConversations(userId: string, limit = 10): Promise<Array<Conversation & { session: Session }>> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select(`
        *,
        session:sessions(*)
      `)
      .eq('sessions.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('获取最近对话失败:', error)
      return []
    }

    return data || []
  }

  // ============= 统计相关 =============

  /**
   * 获取用户统计
   * @param userId - 用户ID
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() // 使用maybeSingle而不是single

    if (error) {
      console.error('获取用户统计失败:', error)
      return null
    }

    // 如果没有统计数据，创建初始统计
    if (!data) {
      console.log('用户统计不存在，创建初始统计:', userId)
      return this.createUserStats(userId)
    }

    return data
  }

  /**
   * 创建用户统计
   * @param userId - 用户ID
   */
  async createUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        total_sessions: 0,
        total_conversations: 0,
        last_active_at: new Date().toISOString(),
        additional_stats: {}
      })
      .select()
      .single()

    if (error) {
      console.error('创建用户统计失败:', error)
      return null
    }

    return data
  }

  // ============= 批量操作 =============

  /**
   * 批量创建对话（用于数据迁移）
   * @param conversations - 对话数组
   */
  async batchCreateConversations(conversations: Omit<Conversation, 'id' | 'created_at'>[]): Promise<boolean> {
    const { error } = await this.supabase
      .from('conversations')
      .insert(conversations)

    if (error) {
      console.error('批量创建对话失败:', error)
      return false
    }

    return true
  }

  // ============= 清理和维护 =============

  /**
   * 删除会话（会级联删除相关对话）
   * @param sessionId - 会话ID
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      console.error('删除会话失败:', error)
      return false
    }

    return true
  }

  /**
   * 清理用户所有数据
   * @param userId - 用户ID
   */
  async clearUserData(userId: string): Promise<boolean> {
    try {
      // 删除会话（会级联删除对话）
      await this.supabase.from('sessions').delete().eq('user_id', userId)
      
      // 删除统计
      await this.supabase.from('user_stats').delete().eq('user_id', userId)
      
      return true
    } catch (error) {
      console.error('清理用户数据失败:', error)
      return false
    }
  }

  // ============= 核心誓言相关 =============

  /**
   * 获取用户的核心誓言
   * @param userId - 用户ID
   */
  async getUserVow(userId: string): Promise<UserVow | null> {
    const { data, error } = await this.supabase
      .from('user_vows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('获取核心誓言失败:', error)
      return null
    }

    return data
  }

  /**
   * 创建或更新用户的核心誓言
   * @param userId - 用户ID
   * @param vowData - 誓言数据
   */
  async upsertUserVow(
    userId: string,
    vowData: Partial<Omit<UserVow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserVow | null> {
    const { data, error } = await this.supabase
      .from('user_vows')
      .upsert({
        user_id: userId,
        ...vowData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('创建/更新核心誓言失败:', error)
      return null
    }

    return data
  }
}

// 导出单例实例
export const db = new DatabaseService()

/**
 * 服务端数据库操作类
 * 使用传入的认证Supabase客户端，确保RLS策略正确工作
 */
export class ServerDatabaseService {
  constructor(private supabase: any) {}

  // ============= 用户资料相关 =============

  /**
   * 获取用户资料（服务端版本）
   * @param userId - 用户ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('获取用户资料失败:', error)
      return null
    }

    // 如果没有资料，自动创建一个
    if (!data) {
      console.log('用户资料不存在，创建新资料:', userId)
      return this.createUserProfile(userId)
    }

    return data
  }

  /**
   * 创建用户资料（服务端版本）
   * @param userId - 用户ID
   */
  async createUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email: null,
        display_name: null,
        weight_loss_goal: null,
        current_weight: null,
        target_weight: null
      })
      .select()
      .single()

    if (error) {
      console.error('创建用户资料失败:', error)
      return null
    }

    return data
  }

  /**
   * 获取用户统计（服务端版本）
   * @param userId - 用户ID
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('获取用户统计失败:', error)
      return null
    }

    // 如果没有统计，自动创建一个
    if (!data) {
      console.log('用户统计不存在，创建初始统计:', userId)
      return this.createUserStats(userId)
    }

    return data
  }

  /**
   * 创建用户统计（服务端版本）
   * @param userId - 用户ID
   */
  async createUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        total_sessions: 0,
        total_conversations: 0,
        last_active_at: new Date().toISOString(),
        additional_stats: {}
      })
      .select()
      .single()

    if (error) {
      console.error('创建用户统计失败:', error)
      return null
    }

    return data
  }

  /**
   * 获取特定会话（服务端版本）
   * @param sessionId - 会话ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('获取会话失败:', error)
      return null
    }

    return data
  }

  /**
   * 创建新会话（服务端版本）
   */
  async createSession(
    userId: string,
    weightLossReason: string,
    originalImageUrl?: string,
    processedImageUrl?: string
  ): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        user_id: userId,
        weight_loss_reason: weightLossReason,
        original_image_url: originalImageUrl || null,
        processed_image_url: processedImageUrl || null,
        metadata: {}
      })
      .select()
      .single()

    if (error) {
      console.error('创建会话失败:', error)
      return null
    }

    return data
  }

  /**
   * 创建新对话（服务端版本）
   */
  async createConversation(
    sessionId: string,
    messageType: 'user' | 'ai',
    content: string,
    isNegative = true
  ): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
        message_type: messageType,
        content: content,
        is_negative: isNegative,
        metadata: {}
      })
      .select()
      .single()

    if (error) {
      console.error('创建对话失败:', error)
      return null
    }

    return data
  }

  // ============= 核心誓言相关 =============

  /**
   * 获取用户的核心誓言
   * @param userId - 用户ID
   */
  async getUserVow(userId: string): Promise<UserVow | null> {
    const { data, error } = await this.supabase
      .from('user_vows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('获取核心誓言失败:', error)
      return null
    }
    return data
  }

  /**
   * 创建或更新用户的核心誓言
   * @param userId - 用户ID
   * @param vowData - 誓言数据
   */
  async upsertUserVow(
    userId: string,
    vowData: Partial<Omit<UserVow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserVow | null> {
    const { data, error } = await this.supabase
      .from('user_vows')
      .upsert(
        {
          user_id: userId,
          ...vowData,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('创建/更新核心誓言失败:', error)
      return null
    }
    return data
  }
} 