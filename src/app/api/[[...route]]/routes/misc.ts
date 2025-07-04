/**
 * @/app/api/[[...route]]/routes/misc.ts
 *
 * 功能说明：处理所有无需用户认证即可访问的、公开的API端点。
 *           这些端点通常用于提供公共信息、应用配置或进行服务状态检查。
 * 包含的端点：
 * - GET /: 应用的健康检查端点。
 * - GET /config: 获取客户端所需的动态公共配置。
 * - GET /warnings: 获取预设的警告/激励文案。
 * - GET /random-warnings: 随机获取一条警告文案。
 * - GET /test-error: 一个专门用于测试错误处理机制的端点。
 * 最后修改时间：2024年7月26日
 */
import { Hono } from 'hono'
import { CONFIG } from '@/config'
import { SERVER_CONFIG } from '@/config/server'
import { CLIENT_CONFIG } from '@/config/client'

// --- 默认消息（从服务端安全配置导入） ---
const DEFAULT_MESSAGES = SERVER_CONFIG.defaults

// --- 激励名言（从服务端安全配置导入） ---
const MOTIVATION_QUOTES = SERVER_CONFIG.motivationQuotes

// --- 警告文案（从服务端安全配置导入） ---
const WARNING_TEXTS = SERVER_CONFIG.warnings

// --- AI配置中心（从统一配置导入） ---
const AI_CONFIG = {
    ...CONFIG.ai,
    textModel: {
        ...CONFIG.ai.textModel,
        key: process.env.AI_API_KEY,
    },
    visionModel: {
        ...CONFIG.ai.visionModel,
        key: process.env.VISION_API_KEY,
    }
}

// --- 工具函数：用于从数组中随机获取指定数量的元素 ---
function getRandomTexts(source: string[], count: number) {
    const shuffled = [...source].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, source.length))
}

const misc = new Hono()

/**
 * @endpoint GET /api
 * @description 应用的健康检查（Health Check）端点。
 *              主要用于服务监控系统（如Vercel、UptimeRobot等）调用，
 *              以确认API服务是否正在正常运行。返回200状态码即表示服务健康。
 * @returns {Response} 返回一个简单的 "ok" 文本。
 */
misc.get('/', (c) => {
  return c.text('ok')
})

/**
 * @endpoint GET /api/config
 * @description 获取客户端所需的动态公共配置。
 *              这种设计将配置从前端代码中分离出来，使得在不重新部署前端的情况下，
 *              可以通过修改服务端来动态调整应用的行为，非常灵活。
 * @param {string} type - 从查询参数中获取的配置类型，如 'filter', 'timing'。
 * @returns {Response} 返回对应类型的JSON配置对象。
 */
misc.get('/config', (c) => {
  const { type } = c.req.query()
  let configData;

  if (type === 'filter') {
    configData = CLIENT_CONFIG.image.filter;
    if (!configData) {
      return c.json({ error: 'Filter config not found' }, 404);
    }
  } else if (type === 'timing') {
    configData = CLIENT_CONFIG.timing;
    if (!configData) {
      return c.json({ error: 'Timing config not found' }, 404);
    }
  } else {
    return c.json({ error: 'Invalid config type' }, 400);
  }

  return c.json(configData);
})

/**
 * @endpoint GET /api/warnings
 * @description 从数据库中获取预设的警告或激励文案列表。
 *              将文案存储在数据库中，可以方便运营人员随时更新内容，而无需修改代码。
 * @param {string} type - 文案类型 ('disgusting' 或 'motivating')，默认为 'disgusting'。
 * @param {string} count - 获取的数量，默认为 '10'。
 * @returns {Response} 返回包含文案列表的JSON对象。
 */
misc.get('/warnings', async (c) => {
  try {
    const { type = 'disgusting', count = '10' } = c.req.query()
    // 注意：当前配置的文案不区分type，因此type参数暂不生效。
    const warnings = getRandomTexts(WARNING_TEXTS, parseInt(count))
    return c.json({ texts: warnings })
  } catch (error) {
    console.error('获取警告文案失败:', error)
    return c.json({ error: '获取文案失败' }, 500)
  }
})

/**
 * @endpoint GET /api/random-warnings
 * @description 随机获取一条警告或激励文案。
 *              这个接口非常适合用于在应用的某些地方展示随机的提示，增加内容的多样性。
 * @param {string} type - 文案类型 ('disgusting' 或 'motivating')，默认为 'disgusting'。
 * @returns {Response} 返回包含单条文案的JSON对象。
 */
misc.get('/random-warnings', async (c) => {
  try {
    const { type = 'disgusting' } = c.req.query()
    const warnings = getRandomTexts(WARNING_TEXTS, 1)
    const warning = warnings[0]

    if (!warning) {
      return c.json({ text: '你总能做出正确的选择。' }) // 提供一个优雅的降级默认值
    }
    return c.json({ text: warning })
  } catch (error) {
    console.error('获取随机警告文案失败:', error)
    return c.json({ error: '获取文案失败' }, 500)
  }
})

/**
 * @endpoint GET /api/test-error
 * @description 一个专门用于测试错误处理机制的端点。
 *              通过主动抛出一个错误，可以验证我们的错误捕获、日志记录
 *              以及对前端的错误响应是否按预期工作。
 */
misc.get('/test-error', (c) => {
  try {
    // 模拟一个意外的错误
    throw new Error('这是一个测试错误，用于验证错误处理流程。')
  } catch (error) {
    // 在真实应用中，这里应该有更复杂的日志记录逻辑
    console.error('测试错误已触发:', error)
    return c.json({ error: '服务器发生了一个测试错误' }, 500)
  }
})

export default misc