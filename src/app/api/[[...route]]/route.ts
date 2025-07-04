/**
 * Hono API 路由处理器
 * 功能：使用Hono框架统一处理所有API请求
 * 包含的端点：/api/generate-text, /api/messages, /api/ai-proxy
 * 最后修改时间：2024年12月
 */

import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { CONFIG } from '@/config'
import { PROMPT_CONFIG } from '@/config/prompts'
import { SERVER_CONFIG } from '@/config/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db, ServerDatabaseService } from '@/lib/supabase/database'
import type { User } from '@supabase/supabase-js'
import misc from './routes/misc'
import userRoutes from './routes/user'
import vow from './routes/vow'
import ai from './routes/ai'

// Hono 上下文环境类型定义
type HonoEnv = {
  Variables: {
    user: User
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

// --- Prompt模板（从统一配置导入） ---
const PROMPTS = PROMPT_CONFIG.main

// --- 限流配置（从统一配置导入） ---
const RATE_LIMIT_CONFIG = CONFIG.rateLimit

// --- AI代理安全配置（部分从统一配置导入） ---
const SECURITY_CONFIG = {
    allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:8080',
        'https://food-less.vercel.app',
        'https://food-less-git-main.vercel.app',
        'https://klp32ttuozuo.online',
    ],
    maxRequestsPerMinute: RATE_LIMIT_CONFIG.perMinute,
    maxRequestsPerHour: RATE_LIMIT_CONFIG.perHour
}

// --- 认证中间件 ---
const authMiddleware = async (c: any, next: () => Promise<void>) => {
    const authResult = await requireAuth(c);
    if (!authResult.success) {
        return authResult.response;
    }
    c.set('user', authResult.user); // 将用户信息附加到上下文中
    await next();
};

// --- 认证相关工具函数 ---

/**
 * 真正的Supabase JWT认证检查
 * @param c - Hono上下文
 * @returns 认证检查结果
 */
async function requireAuth(c: any): Promise<{ success: true; user: any } | { success: false; response: Response }> {
    try {
        // 从请求头获取Authorization token
        const authHeader = c.req.header('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('缺少Authorization头')
            return {
                success: false,
                response: c.json({ error: '请先登录', code: 'UNAUTHORIZED' }, 401)
            }
        }

        // 创建服务端Supabase客户端
        const supabase = createServerSupabaseClient()
        
        // 验证用户token
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            console.log('Token验证失败:', error?.message)
            return {
                success: false,
                response: c.json({ error: '认证失败，请重新登录', code: 'INVALID_TOKEN' }, 401)
            }
        }

        return { success: true, user }
    } catch (error) {
        console.error('认证检查失败:', error)
        return {
            success: false,
            response: c.json({ error: '认证服务错误', code: 'AUTH_ERROR' }, 500)
        }
    }
}

// --- 检查限流（数据库版） ---
async function checkRateLimitDb(deviceId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc('check_rate_limit', {
        identifier_text: deviceId,
        max_per_minute: SECURITY_CONFIG.maxRequestsPerMinute,
        max_per_hour: SECURITY_CONFIG.maxRequestsPerHour
    });

    if (error) {
        console.error('数据库限流函数调用失败:', error);
        // 在数据库函数出错时，为防止服务中断，暂时允许通过，但记录严重错误。
        // 在生产环境中，您可能希望更严格地处理此错误。
        return true; 
    }

    return data;
}

// --- Hono应用实例 ---
const app = new Hono().basePath('/api')
const secureApp = new Hono<HonoEnv>(); // 为受保护的路由实例应用类型

// 在 secureApp 上应用认证中间件
secureApp.use('*', authMiddleware);

// 首先，将所有受保护的路由模块挂载到 secureApp 上
secureApp.route('/', userRoutes)
secureApp.route('/vow', vow)
secureApp.route('/', ai)

// --- API端点：/api/ai-proxy ---
app.post('/ai-proxy', async (c) => {
    try {
        // 1. 验证请求来源
        const origin = c.req.header('origin') || c.req.header('referer')
        if (!origin || !SECURITY_CONFIG.allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
            console.log('Blocked request from:', origin)
            return c.json({ error: 'Forbidden: Invalid origin' }, 403)
        }
        
        // 2. 验证设备ID
        const deviceId = c.req.header('x-device-id')
        if (!deviceId || deviceId.length < 8) {
            return c.json({ error: 'Invalid device ID' }, 400)
        }
        
        // 3. 检查频率限制 (使用新的数据库函数)
        const allowed = await checkRateLimitDb(deviceId);
        if (!allowed) {
            return c.json({ error: RATE_LIMIT_CONFIG.rateLimitMessage }, 429);
        }
        
        // 4. 验证请求参数
        const { prompt, model, temperature, max_tokens } = await c.req.json()
        if (!prompt || typeof prompt !== 'string' || prompt.length < 10) {
            return c.json({ error: 'Invalid prompt' }, 400)
        }
        
        // 5. 检查API密钥
        const AI_TEXT_MODEL_KEY = process.env.AI_API_KEY
        if (!AI_TEXT_MODEL_KEY) {
            console.error('AI_API_KEY not configured')
            return c.json({ error: 'AI service not configured' }, 500)
        }
        
        // 6. 调用真实AI API
        const response = await fetch(CONFIG.ai.textModel.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_TEXT_MODEL_KEY}`
            },
            body: JSON.stringify({
                model: model || CONFIG.ai.textModel.model,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 300
            })
        })
        
        if (!response.ok) {
            console.error('AI API Error:', response.status, response.statusText)
            return c.json({ error: 'AI service temporarily unavailable' }, 500)
        }
        
        const data = await response.json()
        
        // 7. 验证响应格式
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid AI response format:', data)
            return c.json({ error: 'Invalid AI response' }, 500)
        }
        
        // 8. 返回处理后的响应
        const text = data.choices[0].message.content.trim()
        
        return c.json({
            text: text,
            usage: data.usage || {},
            model: data.model || CONFIG.ai.textModel.model
        })
        
    } catch (error: any) {
        console.error('API Proxy Error:', error)
        
        if (error.message.includes('请求过于频繁') || error.message.includes('限制已达上限')) {
            return c.json({ error: error.message }, 429)
        }
        
        return c.json({ error: 'Internal server error' }, 500)
    }
})

// 然后，将公开路由和配置完成的 secureApp 挂载到主应用上
app.route('/', misc)
app.route('/', secureApp)

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app) 