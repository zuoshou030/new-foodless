/**
 * @/app/api/[[...route]]/routes/user.ts
 *
 * 功能说明：处理所有与用户数据相关的、受保护的API端点。
 *           此文件下的所有路由都经过认证中间件，确保只有登录用户才能访问。
 * 包含的端点：
 * - GET /profile: 获取当前用户的完整资料。
 * - PUT /profile: 更新当前用户的个人资料。
 * - GET /sessions: 分页获取用户的历史会话列表。
 * - GET /sessions/:sessionId: 获取单个会话的详细信息。
 * - GET /conversations/:sessionId: 获取单个会话下的所有对话记录。
 * - POST /migrate: 将用户的本地历史数据迁移到云端。
 * - GET /recent-conversations: 获取用户最近的几条对话记录。
 * - POST /sessions: 创建新的会话记录。每次用户上传图片并输入减肥理由时调用。
 * 最后修改时间：2024年7月26日
 */

import { Hono } from 'hono'
import type { User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db, ServerDatabaseService } from '@/lib/supabase/database'

// Hono 上下文环境类型定义
type HonoEnv = {
  Variables: {
    user: User
  }
}

const userRoutes = new Hono<HonoEnv>()

// --- 用户资料管理 ---

/**
 * @endpoint GET /api/profile
 * @description 获取当前登录用户的完整个人资料。
 *              这不仅仅是基础信息，还聚合了用户的统计数据（如使用次数等），
 *              用于在前端的个人中心或仪表盘进行展示。
 * @returns {Response} 返回一个JSON对象，包含 profile（详细资料）、stats（统计数据）和 user（基础认证信息）。
 */
userRoutes.get('/profile', async (c) => {
    try {
        const user = c.get('user');
        
        const supabase = createServerSupabaseClient()
        const serverDb = new ServerDatabaseService(supabase)
        
        const profile = await serverDb.getUserProfile(user.id)
        const stats = await serverDb.getUserStats(user.id)
        
        return c.json({
            profile,
            stats,
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at
            }
        })
    } catch (error: any) {
        console.error('Profile API Error:', error)
        return c.json({ error: '获取资料失败' }, 500)
    }
})

/**
 * @endpoint PUT /api/profile
 * @description 更新当前登录用户的个人资料。
 * @param {object} c.req.json() - 请求体应包含需要更新的字段，例如 { "weight_loss_goal": "新的目标" }。
 * @returns {Response} 返回更新后的个人资料对象。
 */
userRoutes.put('/profile', async (c) => {
    try {
        const user = c.get('user');
        
        const updates = await c.req.json()
        const profile = await db.updateUserProfile(user.id, updates)
        
        if (!profile) {
            return c.json({ error: '更新资料失败' }, 500)
        }
        
        return c.json({ profile })
    } catch (error: any) {
        console.error('Update Profile API Error:', error)
        return c.json({ error: '更新资料失败' }, 500)
    }
})

// --- 会话管理 ---

/**
 * @endpoint GET /api/sessions
 * @description 分页获取当前用户的历史会话列表。
 *              会话（Session）是组织对话的核心概念，代表一次完整的交互过程。
 * @param {string} limit - 每页数量，默认为 '20'。
 * @param {string} offset - 偏移量，用于分页，默认为 '0'。
 * @returns {Response} 返回包含会话列表的JSON对象。
 */
userRoutes.get('/sessions', async (c) => {
    try {
        const user = c.get('user');
        
        const { limit = '20', offset = '0' } = c.req.query()
        const sessions = await db.getUserSessions(
            user.id, 
            parseInt(limit), 
            parseInt(offset)
        )
        
        return c.json({ sessions })
    } catch (error: any) {
        console.error('Sessions API Error:', error)
        return c.json({ error: '获取会话失败' }, 500)
    }
})

/**
 * @endpoint GET /api/sessions/:sessionId
 * @description 获取指定ID的单个会话的详细信息。
 * @param {string} sessionId - 从URL路径中获取的会话ID。
 * @returns {Response} 返回会话的详细信息，如果不存在或无权访问则返回错误。
 */
userRoutes.get('/sessions/:sessionId', async (c) => {
    try {
        const user = c.get('user');
        
        const sessionId = c.req.param('sessionId')
        const session = await db.getSession(sessionId)
        
        if (!session) {
            return c.json({ error: '会话不存在' }, 404)
        }
        
        // 安全校验：确保用户只能访问自己的会话，防止数据越权
        if (session.user_id !== user.id) {
            return c.json({ error: '无权访问此会话' }, 403)
        }
        
        return c.json({ session })
    } catch (error: any) {
        console.error('Session Detail API Error:', error)
        return c.json({ error: '获取会话失败' }, 500)
    }
})

/**
 * @endpoint POST /api/sessions
 * @description 创建新的会话记录。每次用户上传图片并输入减肥理由时调用。
 * @param {string} weightLossReason - 用户输入的减肥理由。
 * @param {string} originalImageUrl - 原始图片的URL（可选）。
 * @param {string} processedImageUrl - 处理后图片的URL（可选）。
 * @returns {Response} 返回创建的会话信息。
 */
userRoutes.post('/sessions', async (c) => {
    try {
        const user = c.get('user');
        const { weightLossReason, originalImageUrl, processedImageUrl } = await c.req.json();

        if (!weightLossReason || typeof weightLossReason !== 'string') {
            return c.json({ error: '减肥理由不能为空' }, 400);
        }

        const session = await db.createSession(
            user.id,
            weightLossReason,
            originalImageUrl,
            processedImageUrl
        );

        if (!session) {
            return c.json({ error: '创建会话失败' }, 500);
        }

        return c.json({ session });
    } catch (error: any) {
        console.error('Create Session API Error:', error);
        return c.json({ error: '创建会话失败' }, 500);
    }
});

// --- 对话管理 ---

/**
 * @endpoint GET /api/conversations/:sessionId
 * @description 获取指定会话下的所有对话记录。
 * @param {string} sessionId - 从URL路径中获取的会话ID。
 * @returns {Response} 返回包含对话记录列表的JSON对象。
 */
userRoutes.get('/conversations/:sessionId', async (c) => {
    try {
        const user = c.get('user');
        
        const sessionId = c.req.param('sessionId')
        
        // 安全校验：同样检查会话的所有权，确保用户无法获取不属于自己的对话内容
        const session = await db.getSession(sessionId)
        if (!session || session.user_id !== user.id) {
            return c.json({ error: '无权访问此会话' }, 403)
        }
        
        const conversations = await db.getConversations(sessionId)
        return c.json({ conversations })
    } catch (error: any) {
        console.error('Conversations API Error:', error)
        return c.json({ error: '获取对话失败' }, 500)
    }
})

// --- 数据迁移 ---

/**
 * @endpoint POST /api/migrate
 * @description 这是一个非常贴心的"一键上云"功能，用于将用户遗留在本地的旧数据迁移到云端账户。
 *              它会接收本地数据，并智能地将其转换为云端的会话和对话格式。
 * @param {object} localData - 请求体中包含的本地数据。
 * @returns {Response} 返回迁移结果的摘要，如成功迁移的会话和对话数量。
 */
userRoutes.post('/migrate', async (c) => {
    try {
        const user = c.get('user');
        
        const { localData } = await c.req.json()
        
        if (!localData) {
            return c.json({ error: '没有提供本地数据' }, 400)
        }
        
        console.log('开始数据迁移，用户:', user.id)
        
        let migratedSessions = 0
        let migratedConversations = 0
        
        // 步骤1: 迁移用户的偏好设置，如减肥原因
        if (localData.userPreferences?.weightLossReason) {
            await db.updateUserProfile(user.id, {
                weight_loss_goal: localData.userPreferences.weightLossReason
            })
        }
        
        // 步骤2: 迁移核心的对话数据
        if (localData.conversations?.length) {
            // 智能分组逻辑：通过判断两条对话的时间间隔，将连续的对话自动划分到同一个"会话"中。
            const sessionGroups: any[] = []
            let currentGroup: any[] = []
            let lastTimestamp = 0
            const SESSION_GAP = 60 * 60 * 1000 // 定义时间间隔为1小时
            
            for (const conv of localData.conversations) {
                if (conv.timestamp - lastTimestamp > SESSION_GAP && currentGroup.length > 0) {
                    sessionGroups.push([...currentGroup])
                    currentGroup = []
                }
                currentGroup.push(conv)
                lastTimestamp = conv.timestamp
            }
            if (currentGroup.length > 0) {
                sessionGroups.push(currentGroup)
            }
            
            // 步骤3: 遍历分组，为每个分组创建新的会话，并批量插入对话记录
            for (const group of sessionGroups) {
                const session = await db.createSession(
                    user.id,
                    group[0]?.content?.substring(0, 50) || '历史数据迁移', // 使用第一条对话内容作为会话标题
                    undefined,
                    undefined
                )
                
                if (session) {
                    migratedSessions++
                    
                    for (const conv of group) {
                        const created = await db.createConversation(
                            session.id,
                            conv.type as 'user' | 'ai',
                            conv.content,
                            conv.isNegative !== false
                        )
                        
                        if (created) {
                            migratedConversations++
                        }
                    }
                }
            }
        }
        
        console.log(`迁移完成: ${migratedSessions}个会话, ${migratedConversations}条对话`)
        
        return c.json({
            success: true,
            migratedSessions,
            migratedConversations
        })
    } catch (error: any) {
        console.error('Migration API Error:', error)
        return c.json({ error: '数据迁移失败' }, 500)
    }
})

// --- 最近对话 ---

/**
 * @endpoint GET /api/recent-conversations
 * @description 这是一个便利性接口，用于快速获取用户最近的几条对话记录。
 *              主要用于在应用的仪表盘或首页上展示最新的动态，提高用户粘性。
 * @param {string} limit - 获取数量，默认为 '10'。
 * @returns {Response} 返回最近对话记录的列表。
 */
userRoutes.get('/recent-conversations', async (c) => {
    try {
        const user = c.get('user');
        
        const { limit = '10' } = c.req.query()
        const conversations = await db.getUserRecentConversations(
            user.id, 
            parseInt(limit)
        )
        
        return c.json({ conversations })
    } catch (error: any) {
        console.error('Recent Conversations API Error:', error)
        return c.json({ error: '获取最近对话失败' }, 500)
    }
})

export default userRoutes 