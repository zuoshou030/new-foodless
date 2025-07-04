/**
 * 饭缩力项目统一配置文件
 * 文件功能：集中管理所有可配置参数，方便开发者修改
 * 最后修改时间：2024-12-19
 */

// ============= AI 服务配置 =============
export const AI_CONFIG = {
  // 启用图像识别的总开关
  enableImageRecognition: true,
  
  // 纯文本模型配置
  textModel: {
    url: 'https://xiaohumini.site/v1/chat/completions',
    //model: 'gpt-4.1-nano-2025-04-14',
    model: 'gemini-2.5-pro-preview-05-06',//deepseek-v3-250324修改为gemini-1.5-pro-latest
    //model: 'gemini-2.0-flash',
    temperature: 0.8,
    maxTokens: {
      disgusting: 3000,   // 厌恶文本最大token数
      motivating: 3000,   // 激励文本最大token数  
      dialogue: 3000,     // 对话文本最大token数 (由600修改)
      vowMotivation: 400 // 新增：核心誓言AI激励文案
    }
  },
  
  // 图像识别模型配置
  visionModel: {
    url: 'https://xiaohumini.site/v1/chat/completions', 
    //model: 'gpt-4.1-nano-2025-04-14',
    //model: 'gemini-2.0-flash',
    model: 'gemini-2.5-pro-preview-05-06',
    temperature: 0.8,
    maxTokens: {
      disgusting: 3000,   // 带图像的厌恶文本最大token数
      motivating: 3000    // 带图像的激励文本最大token数
    }
  }
}

// ============= 图像处理配置 =============
export const IMAGE_CONFIG = {
  // 图片尺寸限制
  maxImageSize: 800,              // 处理后的最大尺寸(像素)
  imageQuality: 0.8,              // JPEG压缩质量 (0-1)
  
  // 恶心滤镜参数配置
  filter: {
    EDGE_THRESHOLD: 30,           // 边缘检测灵敏度 (值越高，越不敏感)
    HIGHLIGHT_THRESHOLD: 180,     // 高光阈值 (超过此亮度的像素被视为高光)
    SHADOW_THRESHOLD: 80,         // 阴影阈值 (低于此亮度的像素被视为阴影)
    DESATURATION: 0.9,            // 饱和度降低程度 (0=原色, 1=完全灰白)
    CONTRAST: 1.4,                // 对比度 (1=原样, >1增加对比度)
    BRIGHTNESS: 0.75,             // 亮度 (1=原样, <1变暗)
    EDGE_SHARPNESS: 1.2,          // 边缘锐化程度 (1=原样, >1更锐利)
  }
}

// ============= UI 界面配置 =============
export const UI_CONFIG = {
  // 动画时长配置
  loadingDuration: 8000,          // 加载动画总时长(毫秒) - 已废弃，保留兼容性
  textSwitchInterval: 2300,       // 警示文字切换间隔(毫秒)
  fadeAnimationDuration: 300,     // 淡入淡出动画时长(毫秒)
  
  // 智能加载时间控制
  smartLoading: {
    minWarningTime: 6000,         // 警示词最少显示时间(毫秒)
    maxWarningTime: 12000,        // 警示词最多显示时间(毫秒)
    aiRetryAttempts: 3,           // AI请求最大重试次数
    aiRetryDelay: 1000,           // AI重试间隔(毫秒)
  },
  
  // 界面文本配置
  defaultLoadingText: '连体重都控制不了还怎么控制人生？',
  
  // 响应式断点配置
  breakpoints: {
    mobile: 768,    // 移动端断点
    tablet: 1024,   // 平板端断点
    desktop: 1280   // 桌面端断点
  }
}

// ============= 用户认证配置 =============
export const AUTH_CONFIG = {
  // Supabase 配置
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  },
  
  // 认证设置
  settings: {
    requireEmailConfirmation: true,   // 是否需要邮箱确认
    allowSignUp: true,                // 是否允许新用户注册
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 会话超时时间（7天）
  },
  
  // 密码要求
  passwordRequirements: {
    minLength: 6,                     // 最小长度
    requireUppercase: false,          // 是否需要大写字母
    requireNumbers: false,            // 是否需要数字
    requireSymbols: false             // 是否需要特殊字符
  },
  
  // 错误消息
  errors: {
    invalidEmail: '请输入有效的邮箱地址',
    weakPassword: '密码至少需要6个字符',
    userNotFound: '用户不存在或密码错误',
    emailNotConfirmed: '请先确认邮箱后再登录',
    tooManyRequests: '请求过于频繁，请稍后再试'
  }
}

// ============= 限流配置 =============
export const RATE_LIMIT_CONFIG = {
  // 请求频率限制
  perMinute: 10,                  // 每分钟最大请求数
  perHour: 50,                    // 每小时最大请求数
  
  // 清理间隔
  cleanupInterval: 300000,        // 限流记录清理间隔(5分钟)
  
  // 错误消息
  rateLimitMessage: '请求过于频繁，请稍后再试',
  deviceIdErrorMessage: '设备标识无效'
}

// ============= 应用元数据配置 =============
export const APP_METADATA = {
  title: '饭缩力 - 帮你对抗食物诱惑',
  description: '引导帮助减肥人群对抗食物诱惑，提供心理干预和认知重塑',
  keywords: '减肥,食物诱惑,心理干预,健康生活',
  author: '饭缩力团队',
  language: 'zh-CN',
  themeColor: '#ffffff',
  
  // 开发环境配置
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // 版本信息
  version: '1.0.0',
  buildDate: new Date().toISOString()
}

// ============= 存储配置 =============
export const STORAGE_CONFIG = {
  // LocalStorage 键名前缀
  keyPrefix: 'food-less-',
  
  // 存储键名
  keys: {
    deviceId: 'device-id',
    conversation: 'conversation-',    // 会话历史前缀
    userPreferences: 'preferences'
  },
  
  // 数据保留时间
  retentionDays: 30                   // 本地数据保留天数
}

// ============= API 端点配置 =============
export const API_CONFIG = {
  endpoints: {
    generateText: '/api/generate-text',
    messages: '/api/messages', 
    aiProxy: '/api/ai-proxy'
  },
  
  // 请求超时配置
  timeout: 30000,                     // 30秒超时
  
  // 重试配置
  retryAttempts: 3,                   // 最大重试次数
  retryDelay: 1000                    // 重试延迟(毫秒)
}

// ============= 默认文本内容 =============
export const DEFAULT_TEXTS = {
  disgusting: "这油腻腻的食物看起来就像是从垃圾桶里捞出来的，散发着令人作呕的气味。",
  motivating: "现在，你站在那里，自豪地看着自己，为自己的胜利而骄傲。这份力量，会带你轻松跑完下一个五公里。",
  
  // 错误消息
  errors: {
    imageProcessing: '图片处理失败，请重试',
    aiService: 'AI服务暂时不可用，请稍后重试',
    networkError: '网络连接失败，请检查网络连接',
    fileTypeError: '不支持的文件类型，请上传图片文件',
    fileSizeError: '文件大小超出限制，请选择较小的图片'
  }
}

// ============= 警示文字库（已移至服务端保护）=============
// 🔒 敏感文案已迁移至 src/config/server.ts，客户端通过 API 动态获取
export const WARNING_TEXTS = [
  // 保留少量通用文案，避免 API 失败时的兜底
  "正在加载中...",
  "请稍等..."
]

// ============= 开发者工具配置 =============
export const DEV_CONFIG = {
  // 调试开关
  enableDebugLog: APP_METADATA.isDevelopment,
  enablePerformanceMonitor: APP_METADATA.isDevelopment,
  
  // 模拟配置
  enableMockData: false,            // 是否启用模拟数据
  mockDelay: 2000,                  // 模拟请求延迟(毫秒)
  
  // 开发服务器配置
  devServer: {
    port: 3000,
    host: 'localhost'
  }
}

// ============= 导出统一配置对象 =============
export const CONFIG = {
  ai: AI_CONFIG,
  image: IMAGE_CONFIG,
  ui: UI_CONFIG,
  auth: AUTH_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  app: APP_METADATA,
  storage: STORAGE_CONFIG,
  api: API_CONFIG,
  texts: DEFAULT_TEXTS,
  warnings: WARNING_TEXTS,
  dev: DEV_CONFIG
} as const

// 类型导出，供TypeScript使用
export type AppConfig = typeof CONFIG 