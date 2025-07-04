/**
 * 客户端配置文件 - 只包含可以公开的配置
 * 敏感的商业参数已移至服务端
 */

// ============= 公开UI配置 =============
export const CLIENT_UI_CONFIG = {
  // 基础动画配置（通用参数，无商业价值）
  fadeAnimationDuration: 300,
  
  // 响应式断点（标准配置）
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  },
  
  // 基础加载文本（使用通用文案）
  defaultLoadingText: '正在处理中...',
}

// ============= 图像处理基础配置 =============
export const CLIENT_IMAGE_CONFIG = {
  // 只保留基础限制，核心算法参数隐藏
  maxImageSize: 800,
  imageQuality: 0.8,
  
  // 补充默认的滤镜参数，作为无法从服务器获取时的安全后备
  filter: {
    CONTRAST: 1.2,
    BRIGHTNESS: 0.8,
    DESATURATION: 0.7,
    EDGE_THRESHOLD: 25,
    HIGHLIGHT_THRESHOLD: 200,
    SHADOW_THRESHOLD: 60,
    EDGE_SHARPNESS: 1.1,
  },
}

// ============= 补充客户端计时/策略配置 =============
export const CLIENT_TIMING_CONFIG = {
  minWarningTime: 6000,
  maxWarningTime: 12000,
  aiRetryAttempts: 3,
  aiRetryDelay: 1000,
}

// ============= API端点配置 =============
export const CLIENT_API_CONFIG = {
  endpoints: {
    generateText: '/api/generate-text',
    messages: '/api/messages',
    getConfig: '/api/config'  // 新增：从服务端获取配置
  },
  timeout: 30000,
}

// ============= 应用元数据（可公开部分）=============
export const CLIENT_APP_CONFIG = {
  title: '饭缩力 - 帮你对抗食物诱惑',
  description: '科学的饮食控制辅助工具',
  version: '1.0.0'
}

// ============= 客户端配置导出 =============
export const CLIENT_CONFIG = {
  ui: CLIENT_UI_CONFIG,
  image: CLIENT_IMAGE_CONFIG,
  api: CLIENT_API_CONFIG,
  app: CLIENT_APP_CONFIG,
  timing: CLIENT_TIMING_CONFIG, // 添加计时配置
} as const 