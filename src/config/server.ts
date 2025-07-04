/**
 * 服务端专用配置 - 包含商业机密参数
 * 此文件永远不会发送到客户端
 */

// ============= 商业机密：图像滤镜核心算法 =============
export const SERVER_FILTER_CONFIG = {
  // 🔒 核心商业算法参数
  EDGE_THRESHOLD: 30,           
  HIGHLIGHT_THRESHOLD: 180,     
  SHADOW_THRESHOLD: 80,         
  DESATURATION: 0.9,            
  CONTRAST: 1.4,                
  BRIGHTNESS: 0.75,             
  EDGE_SHARPNESS: 1.2,          
}

// ============= 商业机密：时间控制策略 =============
export const SERVER_TIMING_CONFIG = {
  // 🔒 心理学优化的时间参数
  minWarningTime: 6000,         // 基于心理学研究的6秒最佳时间
  maxWarningTime: 12000,        // 避免用户厌烦的12秒上限
  textSwitchInterval: 2300,     // 文字切换的黄金间隔
  aiRetryAttempts: 3,           
  aiRetryDelay: 500,           
}

// ============= 商业机密：警示文字库 =============
export const SERVER_WARNING_LIBRARY = [
  // 🔒 精心设计的心理干预文案
  "连体重都控制不了还怎么控制人生？",
  "每一口都在背叛昨天的承诺",
  "镜子不会骗人",
  "胖子没有明天",
  "管住嘴，迈开腿",
  "别让肥肉毁掉你的人生",
  "瘦下来，世界都是你的",
  "自律给我自由",
  "为了更好的自己",
  "这种冲动的感觉我记得",
  "这个循环，什么时候到头？",
  "是嘴巴馋，还是心里空？",
  "就一口，真的没关系吗？",
  "吃完这顿就重新开始？",
  "明早的体重秤，你敢上吗？",
  "镜子里的自己，你喜欢吗？",
  "短暂的爽，换长久的痛。",
  "别再一次，对自己食言了。",
  "清醒的饿，好过饱的悔。",
  "你渴望的，根本不是食物。",
  "是享受，还是自我惩罚？",
  "放下它，就是一场胜利。",
  "别用食物填补内心的洞。",
  "掌控感，比什么都好吃。",
  "你比这股冲动更强大。",
  "那条裤子，还在等你穿。",
  "为未来的你，赢下这一次。",
  "别让食物定义你的人生。",
  "这一次，请选择你自己。",
]

// ============= 商业机密：默认智能文本 =============
export const SERVER_SMART_TEXTS = {
  disgusting: "这油腻腻的食物看起来就像是从垃圾桶里捞出来的，散发着令人作呕的气味。",
  motivating: "现在，你站在那里，自豪地看着自己，为自己的胜利而骄傲。这份力量，会带你轻松跑完下一个五公里。",
}

// ============= 服务端配置导出 =============
export const SERVER_CONFIG = {
  filter: SERVER_FILTER_CONFIG,
  timing: SERVER_TIMING_CONFIG,
  warnings: SERVER_WARNING_LIBRARY,
  texts: SERVER_SMART_TEXTS,
  defaults: {
    disgusting: [
      "这油腻腻的食物看起来就像是从垃圾桶里捞出来的，散发着令人作呕的气味。",
      "每一口都让我的胃在翻滚，仿佛在吞食腐败的残渣。",
      "光是想象那种黏腻的口感就让我浑身不舒服。"
    ],
    motivating: [
      "我成功抵御了这份诱惑！每一次的坚持都让我更加接近理想的自己。",
      "当我看到镜子中越来越自信的身影，我知道所有的努力都是值得的。",
      "这就是自律的力量！"
    ]
  },
  motivationQuotes: [
    "自律是自由的前提",
    "每一次拒绝都是对未来的投资",
    "你比你想象的更强大",
    "坚持的路上，你并不孤单",
    "今天的放弃是明天的遗憾",
    "美好的身材需要时间雕琢",
    "相信过程，相信自己"
  ]
} as const

// 类型导出
export type ServerConfig = typeof SERVER_CONFIG 