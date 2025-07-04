# 饭缩力项目配置管理指南

## 📋 概述

本项目采用统一配置管理系统，将所有可调整的参数集中在 `src/config/` 目录下，方便开发者修改和维护。

## 🗂️ 配置文件结构

```
src/config/
├── index.ts          # 主配置文件
└── prompts.ts        # AI提示词配置文件
```

## 🔧 主要配置类别

### 1. AI 服务配置 (`CONFIG.ai`)

控制 AI 模型的行为和性能参数：

```typescript
export const AI_CONFIG = {
  enableImageRecognition: true,    // 图像识别功能开关
  
  textModel: {
    url: 'https://xiaohumini.site/v1/chat/completions',
    model: 'deepseek-v3-250324',
    temperature: 1.0,              // 创意度 (0-2)
    maxTokens: {
      disgusting: 800,             // 厌恶文本最大长度
      motivating: 600,             // 激励文本最大长度
      dialogue: 500                // 对话文本最大长度
    }
  },
  
  visionModel: {
    url: 'https://xiaohumini.site/v1/chat/completions',
    model: 'gemini-1.5-pro-latest',
    temperature: 1.0,
    maxTokens: {
      disgusting: 800,
      motivating: 400
    }
  }
}
```

**常用修改场景：**
- 切换AI模型：修改 `model` 字段
- 调整创意度：修改 `temperature` (数值越高越有创意)
- 控制文本长度：修改 `maxTokens` 对象中的值

### 2. 图像处理配置 (`CONFIG.image`)

控制图片处理和滤镜效果：

```typescript
export const IMAGE_CONFIG = {
  maxImageSize: 800,              // 处理后的最大尺寸(像素)
  imageQuality: 0.8,              // JPEG压缩质量 (0-1)
  
  filter: {
    EDGE_THRESHOLD: 30,           // 边缘检测灵敏度
    HIGHLIGHT_THRESHOLD: 180,     // 高光阈值
    SHADOW_THRESHOLD: 80,         // 阴影阈值
    DESATURATION: 0.9,            // 饱和度降低程度
    CONTRAST: 1.4,                // 对比度增强
    BRIGHTNESS: 0.75,             // 亮度调整
    EDGE_SHARPNESS: 1.2,          // 边缘锐化程度
  }
}
```

**常用修改场景：**
- 提高图片质量：增大 `maxImageSize` 和 `imageQuality`
- 调整滤镜强度：修改 `filter` 对象中的参数
- 优化性能：降低 `maxImageSize` 减少处理时间

### 3. UI 界面配置 (`CONFIG.ui`)

控制用户界面的时间和动画参数：

```typescript
export const UI_CONFIG = {
  loadingDuration: 8000,          // 加载动画总时长(毫秒)
  textSwitchInterval: 2300,       // 警示文字切换间隔(毫秒)
  fadeAnimationDuration: 300,     // 淡入淡出动画时长(毫秒)
  defaultLoadingText: '连体重都控制不了还怎么控制人生？',
  
  breakpoints: {
    mobile: 768,                  // 移动端断点
    tablet: 1024,                 // 平板端断点
    desktop: 1280                 // 桌面端断点
  }
}
```

**常用修改场景：**
- 调整加载时间：修改 `loadingDuration`
- 改变文字切换速度：修改 `textSwitchInterval`
- 自定义默认文字：修改 `defaultLoadingText`

### 4. 限流配置 (`CONFIG.rateLimit`)

控制API请求频率限制：

```typescript
export const RATE_LIMIT_CONFIG = {
  perMinute: 10,                  // 每分钟最大请求数
  perHour: 50,                    // 每小时最大请求数
  cleanupInterval: 300000,        // 限流记录清理间隔(5分钟)
  rateLimitMessage: '请求过于频繁，请稍后再试',
  deviceIdErrorMessage: '设备标识无效'
}
```

### 5. 文本内容配置 (`CONFIG.texts` 和 `CONFIG.warnings`)

管理应用中的文字内容：

```typescript
export const DEFAULT_TEXTS = {
  disgusting: "这油腻腻的食物看起来就像是从垃圾桶里捞出来的...",
  motivating: "现在，你站在那里，自豪地看着自己...",
  
  errors: {
    imageProcessing: '图片处理失败，请重试',
    aiService: 'AI服务暂时不可用，请稍后重试',
    // ... 更多错误消息
  }
}

export const WARNING_TEXTS = [
  "连体重都控制不了还怎么控制人生？",
  "每一口都在背叛昨天的承诺",
  // ... 更多警示文字
]
```

## 🎯 AI 提示词配置 (`PROMPT_CONFIG`)

独立管理所有AI对话的提示词模板，在 `src/config/prompts.ts` 文件中：

### 主要提示词类型：

1. **厌恶型提示词** (`disgusting`) - 帮助用户抗拒食物诱惑
2. **激励型提示词** (`motivating`) - 鼓励用户坚持目标
3. **对话型提示词** (`dialogue`) - 深度心理辅导
4. **错误处理提示词** (`error`) - 服务异常时的备用文案

## 🛠️ 修改配置的方法

### 方法一：直接修改配置文件

1. 打开 `src/config/index.ts`
2. 找到需要修改的配置项
3. 修改对应的值
4. 保存文件，重启开发服务器

```typescript
// 例如：调整加载时间为10秒
export const UI_CONFIG = {
  loadingDuration: 10000,  // 原来是8000
  // ... 其他配置
}
```

### 方法二：通过环境变量（推荐）

对于敏感配置（如API密钥），建议使用环境变量：

```bash
# .env.local
AI_API_KEY=your_text_model_api_key
VISION_API_KEY=your_vision_model_api_key
```

### 方法三：运行时动态修改

对于需要动态调整的配置，可以创建管理后台或配置接口。

## 📝 常见配置场景

### 场景1：调整AI回复的创意度

```typescript
// 让AI回复更保守一些
textModel: {
  temperature: 0.7,  // 原来是1.0
}
```

### 场景2：加快页面加载速度

```typescript
// 缩短加载动画时间
UI_CONFIG: {
  loadingDuration: 5000,  // 原来是8000
  textSwitchInterval: 1500,  // 原来是2300
}
```

### 场景3：调整图片处理质量

```typescript
// 提高图片质量但增加处理时间
IMAGE_CONFIG: {
  maxImageSize: 1200,  // 原来是800
  imageQuality: 0.9,   // 原来是0.8
}
```

### 场景4：修改警示文字

```typescript
// 添加新的警示文字
export const WARNING_TEXTS = [
  ...existing_texts,
  "你的新警示文字",
  "另一条自定义文字"
]
```

### 场景5：自定义错误消息

```typescript
// 修改错误提示文字
errors: {
  imageProcessing: '图片上传失败，请检查网络连接',
  aiService: '智能服务繁忙，请稍等片刻',
}
```

## 🔍 配置验证

项目提供了类型安全的配置管理，修改配置时TypeScript会帮助检查：

```typescript
// 错误示例 - TypeScript会报错
CONFIG.ui.loadingDuration = "8000"  // ❌ 应该是数字

// 正确示例
CONFIG.ui.loadingDuration = 8000     // ✅
```

## 🚨 注意事项

1. **重启服务器**：修改配置文件后需要重启开发服务器才能生效
2. **类型检查**：确保修改的值符合TypeScript类型要求
3. **备份配置**：修改前建议备份原始配置
4. **测试验证**：修改后要测试相关功能是否正常
5. **环境变量**：敏感信息使用环境变量，不要硬编码在配置文件中

## 📚 进阶使用

### 环境相关配置

```typescript
// 根据环境自动调整配置
export const DEV_CONFIG = {
  enableDebugLog: APP_METADATA.isDevelopment,
  enableMockData: false,
  mockDelay: 2000,
}
```

### 配置继承和覆盖

```typescript
// 可以基于基础配置创建特定环境的配置
const baseConfig = CONFIG
const productionConfig = {
  ...baseConfig,
  ui: {
    ...baseConfig.ui,
    loadingDuration: 6000  // 生产环境缩短加载时间
  }
}
```

## 🎉 总结

通过这个统一配置系统，开发者可以：

- ✅ 快速调整应用行为而无需深入代码
- ✅ 集中管理所有可变参数
- ✅ 享受TypeScript类型安全保护
- ✅ 轻松进行A/B测试和性能优化
- ✅ 简化部署和环境管理

如有任何配置相关问题，请参考本指南或查看配置文件中的详细注释。 