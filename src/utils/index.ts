/**
 * 文件功能：工具函数集合
 * 包含的函数：cn, formatDate, generateId, compressImage
 * 最后修改时间：2024-12-19
 */

/**
 * 工具函数集合
 * 功能：提供API调用、设备ID生成、图像处理等功能
 * 最后修改时间：2024年12月
 */

// --- 基础工具函数 ---

/**
 * 类名合并工具
 */
type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean }

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .filter(Boolean)
    .map(input => {
      if (typeof input === 'string') return input
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ')
      }
      return ''
    })
    .join(' ')
    .trim()
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | number): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 防抖函数
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// --- API调用函数 ---
/**
 * 调用AI文字生成API (现在使用Hono)
 */
export async function generateAIText(
  type: 'disgusting' | 'motivating' | 'dialogue',
  foodName?: string,
  imageData?: string,
  sessionId?: string,
  conversationHistory?: any[]
): Promise<any> {
  try {
    const response = await fetch('/api/generate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        foodName,
        imageData,
        sessionId,
        conversationHistory
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('AI文字生成失败:', error)
    throw error
  }
}

/**
 * 调用消息API (现在使用Hono)
 */
export async function getMessages(
  type: 'warning' | 'default' | 'motivation' | 'all',
  count: number = 10
): Promise<any> {
  try {
    const response = await fetch(`/api/messages?type=${type}&count=${count}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('获取消息失败:', error)
    throw error
  }
}

/**
 * 调用AI代理API (现在使用Hono)
 */
export async function callAIProxy(
  prompt: string,
  model?: string,
  temperature?: number,
  maxTokens?: number
): Promise<any> {
  try {
    const deviceId = getDeviceId()
    
    const response = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId
      },
      body: JSON.stringify({
        prompt,
        model,
        temperature,
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('AI代理调用失败:', error)
    throw error
  }
}

// --- 设备ID和会话管理 ---
/**
 * 生成或获取设备ID（使用统一配置）
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server-side'
  
  // 动态导入配置以避免服务端渲染问题
  const { CONFIG } = require('@/config')
  const storageKey = CONFIG.storage.keyPrefix + CONFIG.storage.keys.deviceId
  
  let deviceId = localStorage.getItem(storageKey)
  
  if (!deviceId) {
    deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem(storageKey, deviceId)
  }
  
  return deviceId
}

/**
 * 生成会话ID
 */
export function generateSessionId(): string {
  return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

// --- 图像处理函数 ---
/**
 * 将文件转换为Base64数据URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 压缩图片到指定大小
 */
export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('图片压缩失败'))
        }
      }, 'image/jpeg', quality)
    }
    
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 对Canvas应用油光轮廓滤镜
 */
export function applyOilyFilter(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // 应用油光轮廓效果
  for (let i = 0; i < data.length; i += 4) {
    // 降低饱和度，增加对比度
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    // 转换为灰度值
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    
    // 应用油腻效果：增强黄绿色调，降低红色
    data[i] = Math.min(255, gray * 0.8 + 30)     // R: 减少红色
    data[i + 1] = Math.min(255, gray * 1.1 + 20) // G: 增强绿色
    data[i + 2] = Math.min(255, gray * 0.6 + 10) // B: 减少蓝色
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * 处理图片文件：压缩 -> 油光滤镜 -> Base64
 */
export async function processImageFile(file: File): Promise<string> {
  try {
    // 1. 压缩图片
    const compressedBlob = await compressImage(file)
    
    // 2. 转换为Canvas并应用滤镜
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        // 应用油光滤镜
        applyOilyFilter(canvas)
        
        // 转换为Base64
        const base64 = canvas.toDataURL('image/jpeg', 0.8)
        resolve(base64)
      }
      
      img.onerror = reject
      img.src = URL.createObjectURL(compressedBlob!)
    })
  } catch (error) {
    console.error('图片处理失败:', error)
    throw error
  }
}

// --- 输入验证函数 ---
/**
 * 验证食物名称输入
 */
export function validateFoodName(name: string): { isValid: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: '请输入食物名称' }
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, message: '食物名称至少需要2个字符' }
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, message: '食物名称不能超过50个字符' }
  }
  
  return { isValid: true }
}

/**
 * 验证对话输入
 */
export function validateDialogueInput(input: string): { isValid: boolean; message?: string } {
  if (!input || input.trim().length === 0) {
    return { isValid: false, message: '请输入你想吃的理由' }
  }
  
  if (input.trim().length < 3) {
    return { isValid: false, message: '理由至少需要3个字符' }
  }
  
  if (input.trim().length > 200) {
    return { isValid: false, message: '理由不能超过200个字符' }
  }
  
  return { isValid: true }
}

// --- 本地存储管理 ---
/**
 * 保存对话历史到本地存储（使用统一配置）
 */
export function saveConversationHistory(sessionId: string, history: any[]): void {
  if (typeof window === 'undefined') return
  
  try {
    const { CONFIG } = require('@/config')
    const key = CONFIG.storage.keyPrefix + CONFIG.storage.keys.conversation + sessionId
    localStorage.setItem(key, JSON.stringify(history))
  } catch (error) {
    console.warn('保存对话历史失败:', error)
  }
}

/**
 * 从本地存储获取对话历史（使用统一配置）
 */
export function getConversationHistory(sessionId: string): any[] {
  if (typeof window === 'undefined') return []
  
  try {
    const { CONFIG } = require('@/config')
    const key = CONFIG.storage.keyPrefix + CONFIG.storage.keys.conversation + sessionId
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.warn('获取对话历史失败:', error)
    return []
  }
}

/**
 * 清除对话历史
 */
export function clearConversationHistory(sessionId?: string): void {
  if (typeof window === 'undefined') return
  
  try {
    if (sessionId) {
      const key = `food-less-conversation-${sessionId}`
      localStorage.removeItem(key)
    } else {
      // 清除所有对话历史
      const keys = Object.keys(localStorage).filter(key => key.startsWith('food-less-conversation-'))
      keys.forEach(key => localStorage.removeItem(key))
    }
  } catch (error) {
    console.warn('清除对话历史失败:', error)
  }
}

// --- 错误处理 ---
/**
 * 解析API错误响应
 */
export function parseAPIError(error: any): string {
  if (error?.message) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return '服务暂时不可用，请稍后再试'
}

// --- 调试和日志 ---
/**
 * 安全的控制台日志输出
 */
export function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[FoodLess Debug] ${message}`, data || '')
  }
}

/**
 * 性能监测
 */
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const endTime = performance.now()
      debugLog(`性能监测 [${name}]`, `${(endTime - startTime).toFixed(2)}ms`)
      resolve(result)
    } catch (error) {
      const endTime = performance.now()
      debugLog(`性能监测 [${name}] 失败`, `${(endTime - startTime).toFixed(2)}ms`)
      reject(error)
    }
  })
} 