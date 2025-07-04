/**
 * 文件功能：TypeScript类型定义
 * 包含的类型：AI响应、图像处理、用户输入等相关类型
 * 最后修改时间：2024-12-19
 */

// AI响应相关类型
export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// 图像处理相关类型
export interface ImageProcessResult {
  processedImageUrl: string;
  originalImageUrl: string;
}

// 用户输入类型
export interface UserInput {
  type: 'image' | 'text';
  content: string | File;
  timestamp: number;
}

// 对话消息类型
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  isNegative?: boolean; // 是否为负面独白
}

// 核心誓言类型
export interface UserVow {
  id: string;
  user_id: string;
  vow_text: string;
  image_url: string | null;
  motivational_text: string | null;
  ai_motivational_text: string | null;
  created_at: string;
  updated_at: string;
}

// 应用状态类型
export interface AppState {
  currentStep: 'input' | 'processing' | 'result' | 'chat';
  isLoading: boolean;
  error: string | null;
  processedImage: ImageProcessResult | null;
  chatHistory: ChatMessage[];
}

// API请求类型
export interface GenerateTextRequest {
  userInput: string;
  imageDescription?: string;
  isFollowUp?: boolean;
  isNegative?: boolean;
}

// 组件Props类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
} 