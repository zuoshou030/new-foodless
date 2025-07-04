/**
 * 文件功能：数据迁移工具
 * 包含的功能：localStorage到云端的数据迁移
 * 最后修改时间：2024-12-19
 */

import { generateId } from './index'
import { db } from '@/lib/supabase/database'
import type { ChatMessage } from '@/types'

// 本地数据结构类型
interface LocalStorageData {
  conversations?: ChatMessage[]
  userPreferences?: {
    weightLossReason?: string
    lastUsed?: string
  }
}

/**
 * 数据迁移服务类
 */
export class MigrationService {
  private readonly STORAGE_PREFIX = 'food-less-'
  
  /**
   * 检查是否有本地数据需要迁移
   * @returns 是否有数据需要迁移
   */
  hasLocalData(): boolean {
    try {
      const conversations = localStorage.getItem(`${this.STORAGE_PREFIX}conversations`)
      const preferences = localStorage.getItem(`${this.STORAGE_PREFIX}preferences`)
      
      return !!(conversations || preferences)
    } catch (error) {
      console.warn('检查本地数据时出错:', error)
      return false
    }
  }

  /**
   * 获取本地存储的数据
   * @returns 本地数据对象
   */
  getLocalData(): LocalStorageData {
    const data: LocalStorageData = {}
    
    try {
      // 获取对话历史
      const conversationsStr = localStorage.getItem(`${this.STORAGE_PREFIX}conversations`)
      if (conversationsStr) {
        data.conversations = JSON.parse(conversationsStr)
      }
      
      // 获取用户偏好
      const preferencesStr = localStorage.getItem(`${this.STORAGE_PREFIX}preferences`)
      if (preferencesStr) {
        data.userPreferences = JSON.parse(preferencesStr)
      }
    } catch (error) {
      console.error('读取本地数据失败:', error)
    }
    
    return data
  }

  /**
   * 将本地数据迁移到云端
   * @param userId - 用户ID
   * @returns 迁移结果
   */
  async migrateToCloud(userId: string): Promise<{
    success: boolean
    migratedSessions: number
    migratedConversations: number
    error?: string
  }> {
    const result = {
      success: false,
      migratedSessions: 0,
      migratedConversations: 0,
      error: undefined as string | undefined
    }

    try {
      const localData = this.getLocalData()
      
      // 如果没有本地数据，直接返回成功
      if (!localData.conversations?.length && !localData.userPreferences) {
        result.success = true
        return result
      }

      // 更新用户资料（如果有偏好设置）
      if (localData.userPreferences?.weightLossReason) {
        await db.updateUserProfile(userId, {
          weight_loss_goal: localData.userPreferences.weightLossReason
        })
      }

      // 迁移对话数据
      if (localData.conversations?.length) {
        const migrationResult = await this.migrateConversations(
          userId, 
          localData.conversations
        )
        
        result.migratedSessions = migrationResult.sessions
        result.migratedConversations = migrationResult.conversations
      }

      result.success = true
      
      // 迁移成功后，备份并清理本地数据
      await this.backupAndClearLocalData()

    } catch (error) {
      console.error('数据迁移失败:', error)
      result.error = error instanceof Error ? error.message : '未知错误'
    }

    return result
  }

  /**
   * 迁移对话数据
   * @param userId - 用户ID  
   * @param conversations - 对话列表
   */
  private async migrateConversations(
    userId: string, 
    conversations: ChatMessage[]
  ): Promise<{ sessions: number, conversations: number }> {
    let sessionCount = 0
    let conversationCount = 0

    // 按会话分组对话（简单的按时间间隔分组）
    const sessionGroups = this.groupConversationsBySession(conversations)

    for (const group of sessionGroups) {
      // 创建会话
      const session = await db.createSession(
        userId,
        group.weightLossReason || '数据迁移导入',
        undefined, // 暂时没有图片URL
        undefined
      )

      if (session) {
        sessionCount++

        // 创建该会话的对话
        for (const conv of group.conversations) {
          const created = await db.createConversation(
            session.id,
            conv.type as 'user' | 'ai',
            conv.content,
            conv.isNegative !== false // 默认为负面，除非明确标记为false
          )

          if (created) {
            conversationCount++
          }
        }
      }
    }

    return { sessions: sessionCount, conversations: conversationCount }
  }

  /**
   * 将对话按会话分组
   * @param conversations - 对话列表
   */
  private groupConversationsBySession(conversations: ChatMessage[]): Array<{
    weightLossReason: string
    conversations: ChatMessage[]
  }> {
    const groups: Array<{
      weightLossReason: string
      conversations: ChatMessage[]
    }> = []

    let currentGroup: ChatMessage[] = []
    let lastTimestamp = 0
    const SESSION_GAP = 60 * 60 * 1000 // 1小时的间隔认为是新会话

    for (const conv of conversations) {
      // 如果时间间隔超过阈值，开始新会话
      if (conv.timestamp - lastTimestamp > SESSION_GAP && currentGroup.length > 0) {
        groups.push({
          weightLossReason: this.extractWeightLossReason(currentGroup),
          conversations: [...currentGroup]
        })
        currentGroup = []
      }

      currentGroup.push(conv)
      lastTimestamp = conv.timestamp
    }

    // 添加最后一组
    if (currentGroup.length > 0) {
      groups.push({
        weightLossReason: this.extractWeightLossReason(currentGroup),
        conversations: currentGroup
      })
    }

    return groups
  }

  /**
   * 从对话中提取减肥理由
   * @param conversations - 对话列表
   */
  private extractWeightLossReason(conversations: ChatMessage[]): string {
    // 尝试从用户消息中提取减肥理由
    for (const conv of conversations) {
      if (conv.type === 'user' && conv.content.length > 10) {
        // 如果用户消息包含减肥相关词汇，使用它
        if (/减肥|瘦身|健康|体重|身材/.test(conv.content)) {
          return conv.content.substring(0, 50) // 限制长度
        }
      }
    }
    
    return '历史数据迁移'
  }

  /**
   * 备份并清理本地数据
   */
  private async backupAndClearLocalData(): Promise<void> {
    try {
      const localData = this.getLocalData()
      
      // 将数据备份到特殊的键名中
      const backupKey = `${this.STORAGE_PREFIX}backup-${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify({
        ...localData,
        migratedAt: new Date().toISOString()
      }))

      // 清理原始数据
      localStorage.removeItem(`${this.STORAGE_PREFIX}conversations`)
      localStorage.removeItem(`${this.STORAGE_PREFIX}preferences`)
      
      console.log('本地数据已备份并清理')
    } catch (error) {
      console.error('备份本地数据失败:', error)
    }
  }

  /**
   * 获取迁移统计信息
   */
  getMigrationStats(): {
    hasLocalData: boolean
    localConversationsCount: number
    estimatedSessions: number
  } {
    const localData = this.getLocalData()
    const conversationCount = localData.conversations?.length || 0
    
    return {
      hasLocalData: this.hasLocalData(),
      localConversationsCount: conversationCount,
      estimatedSessions: conversationCount > 0 ? Math.ceil(conversationCount / 10) : 0
    }
  }

  /**
   * 清理所有备份数据
   */
  clearAllBackups(): void {
    try {
      const keys = Object.keys(localStorage)
      const backupKeys = keys.filter(key => 
        key.startsWith(`${this.STORAGE_PREFIX}backup-`)
      )
      
      backupKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log(`已清理 ${backupKeys.length} 个备份文件`)
    } catch (error) {
      console.error('清理备份数据失败:', error)
    }
  }
}

// 导出单例实例
export const migrationService = new MigrationService() 