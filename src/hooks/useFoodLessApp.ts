import { useState, useRef, useCallback, useEffect } from 'react';
import { AppState, ImageProcessResult, ChatMessage } from '@/types';
import { generateId } from '@/utils';
import { CLIENT_CONFIG } from '@/config/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { migrationService } from '@/utils/migration';
import usePersistentState from './usePersistentState';

// 动态配置接口
interface DynamicConfig {
  filter?: any;
  timing?: any;
  texts?: any;
}

// 扩展状态接口
interface ExtendedAppState extends AppState {
  uploadedImage?: File;
  weightLossReason?: string;
  currentSessionId?: string;
}

// 数据迁移状态接口
interface MigrationState {
  isChecking: boolean;
  hasLocalData: boolean;
  isMigrating: boolean;
  migrationCompleted: boolean;
  migrationError?: string;
}

/**
 * @description 管理饭缩力主应用所有业务逻辑的自定义Hook
 * @returns 返回状态、引用和事件处理函数，供UI组件使用
 */
export const useFoodLessApp = () => {
  // 🔒 用户认证状态
  const { user, session } = useAuth();

  // 🔒 动态配置状态（从服务端安全获取）
  const [dynamicConfig, setDynamicConfig] = useState<DynamicConfig>({});
  const [configLoaded, setConfigLoaded] = useState(false);

  // 🔒 数据迁移状态
  const [migrationState, setMigrationState] = useState<MigrationState>({
    isChecking: false,
    hasLocalData: false,
    isMigrating: false,
    migrationCompleted: false,
  });

  // 应用状态管理 - 使用持久化状态Hook
  const [appState, setAppState] = usePersistentState<ExtendedAppState>('foodless_appState', {
    currentStep: 'input',
    isLoading: false,
    error: null,
    processedImage: null,
    chatHistory: [],
    uploadedImage: undefined,
    weightLossReason: undefined,
    currentSessionId: undefined,
  });

  // 引用元素
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * 🔒 动态加载服务端安全配置
   */
  const loadDynamicConfig = useCallback(async () => {
    try {
      // 并行获取所有配置
      const responses = await Promise.allSettled([
        fetch('/api/config?type=filter'),
        fetch('/api/config?type=timing'),
        fetch('/api/warnings?count=5'),
      ]);

      const [filterResponse, timingResponse, textsResponse] = responses;

      // 更稳健地处理结果
      const filter = 
        filterResponse.status === 'fulfilled' && filterResponse.value.ok 
        ? await filterResponse.value.json() 
        : {};
      
      const timing =
        timingResponse.status === 'fulfilled' && timingResponse.value.ok
        ? await timingResponse.value.json()
        : {};
        
      const warningsData =
        textsResponse.status === 'fulfilled' && textsResponse.value.ok
        ? await textsResponse.value.json()
        : { texts: [] };

      // 构建安全的默认文本
      const texts = {
        disgusting: warningsData.texts[0] || '请重新考虑这个选择。',
        motivating: '恭喜你做出了正确的选择！',
      };

      setDynamicConfig({ filter, timing, texts });
      setConfigLoaded(true);
    } catch (error) {
      console.warn('配置加载失败，使用安全默认值:', error);

      // 使用最基础的安全配置
      setDynamicConfig({
        filter: {
          CONTRAST: 1.2,
          BRIGHTNESS: 0.8,
          DESATURATION: 0.7,
          EDGE_THRESHOLD: 25,
          HIGHLIGHT_THRESHOLD: 200,
          SHADOW_THRESHOLD: 60,
          EDGE_SHARPNESS: 1.1,
        },
        timing: {
          minWarningTime: 6000,
          maxWarningTime: 12000,
          aiRetryAttempts: 3,
          aiRetryDelay: 1000,
        },
        texts: {
          disgusting: '请重新考虑这个选择。',
          motivating: '恭喜你做出了正确的选择！',
        },
      });
      setConfigLoaded(true);
    }
  }, []);

  /**
   * 🔒 通用认证fetch函数
   * @param url - 请求URL
   * @param options - fetch选项
   */
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      // 准备认证header
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // 从session获取access_token并添加到请求头
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        console.warn('用户未登录或session过期，session结构:', session);
        throw new Error('用户认证失败，请重新登录');
      }

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [session]
  );

  /**
   * 🔒 执行数据迁移
   */
  const performMigration = useCallback(async () => {
    if (!user) return;

    setMigrationState((prev) => ({ ...prev, isMigrating: true }));

    try {
      const localData = migrationService.getLocalData();

      const response = await authenticatedFetch('/api/migrate', {
        method: 'POST',
        body: JSON.stringify({ localData }),
      });

      if (!response.ok) {
        throw new Error('迁移请求失败');
      }

      const result = await response.json();

      setMigrationState((prev) => ({
        ...prev,
        isMigrating: false,
        migrationCompleted: true,
      }));

      // 显示迁移结果
      alert(
        `数据迁移成功！\n` +
          `迁移了 ${result.migratedSessions} 个会话\n` +
          `迁移了 ${result.migratedConversations} 条对话`
      );

      // 清理本地数据
      migrationService.clearAllBackups();
    } catch (error) {
      console.error('数据迁移失败:', error);
      setMigrationState((prev) => ({
        ...prev,
        isMigrating: false,
        migrationError: error instanceof Error ? error.message : '迁移失败',
      }));
    }
  }, [user, authenticatedFetch]);

  /**
   * 🔒 检查和处理数据迁移
   */
  const checkAndHandleMigration = useCallback(async () => {
    if (!user) return;

    setMigrationState((prev) => ({ ...prev, isChecking: true }));

    try {
      // 检查是否有本地数据需要迁移
      const hasLocalData = migrationService.hasLocalData();

      setMigrationState((prev) => ({
        ...prev,
        hasLocalData,
        isChecking: false,
      }));

      // 如果有本地数据，提示用户是否迁移
      if (hasLocalData) {
        const userConfirm = confirm(
          '检测到您有本地数据，是否要将其迁移到云端？\n' +
            '迁移后您可以在任何设备上访问这些数据。'
        );

        if (userConfirm) {
          await performMigration();
        }
      }
    } catch (error) {
      console.error('迁移检查失败:', error);
      setMigrationState((prev) => ({
        ...prev,
        isChecking: false,
        migrationError: '迁移检查失败',
      }));
    }
  }, [user, performMigration]);

  /**
   * 🔒 加载用户配置和历史数据
   */
  const loadUserData = useCallback(async () => {
    if (!user || !session) return;

    try {
      // 获取用户资料
      const profileResponse = await authenticatedFetch('/api/profile');
      if (profileResponse.ok) {
        const { profile } = await profileResponse.json();

        // 如果用户有默认的减肥目标，设置到状态中
        if (profile?.weight_loss_goal) {
          setAppState((prev) => ({
            ...prev,
            weightLossReason: prev.weightLossReason || profile.weight_loss_goal,
          }));
        }
      } else {
        console.warn(
          '获取用户资料失败:',
          profileResponse.status,
          profileResponse.statusText
        );
      }

      // 🔥 状态一致性检查：如果有currentSessionId但缺少相关数据，尝试恢复
      if (appState.currentSessionId && (!appState.processedImage || appState.chatHistory.length === 0)) {
        console.log('🔄 检测到不完整的会话状态，尝试从服务器恢复...');
        
        try {
          // 获取会话详情
          const sessionResponse = await authenticatedFetch(`/api/sessions/${appState.currentSessionId}`);
          if (sessionResponse.ok) {
            const { session: sessionData } = await sessionResponse.json();
            
            // 获取对话历史
            const conversationResponse = await authenticatedFetch(`/api/conversations/${appState.currentSessionId}`);
            if (conversationResponse.ok) {
              const { conversations } = await conversationResponse.json();
              
              // 恢复完整状态
              const chatHistory = conversations.map((conv: any) => ({
                id: conv.id,
                type: conv.message_type,
                content: conv.content,
                timestamp: new Date(conv.created_at).getTime(),
                isNegative: conv.is_negative,
              }));

              setAppState((prev) => ({
                ...prev,
                processedImage: sessionData.processed_image_url ? {
                  processedImageUrl: sessionData.processed_image_url,
                  originalImageUrl: sessionData.original_image_url || '',
                } : prev.processedImage,
                chatHistory: chatHistory.length > 0 ? chatHistory : prev.chatHistory,
                weightLossReason: prev.weightLossReason || sessionData.weight_loss_reason,
              }));

              console.log('✅ 会话状态已从服务器恢复');
            }
          }
        } catch (syncError) {
          console.warn('会话状态同步失败，将清理本地状态:', syncError);
          // 清理不一致的状态
          setAppState((prev) => ({
            ...prev,
            currentSessionId: undefined,
            chatHistory: [],
            processedImage: null,
          }));
        }
      }

      // 获取最近会话（可选，用于快速继续）
      const sessionsResponse = await authenticatedFetch('/api/sessions?limit=1');
      if (sessionsResponse.ok) {
        const { sessions } = await sessionsResponse.json();

        if (sessions.length > 0) {
          // 可以选择是否自动加载最近的会话
          console.log('找到最近的会话:', sessions[0].id);
        }
      } else {
        console.warn(
          '获取会话历史失败:',
          sessionsResponse.status,
          sessionsResponse.statusText
        );
      }
    } catch (error) {
      console.error('用户数据加载失败:', error);

      // 如果是认证错误，提示用户重新登录
      if (error instanceof Error && error.message.includes('认证失败')) {
        setAppState((prev) => ({
          ...prev,
          error: '登录状态过期，请刷新页面重新登录',
        }));
      }
    }
  }, [user, session, appState.currentSessionId, appState.processedImage, appState.chatHistory, authenticatedFetch]);

  // 组件挂载时加载配置
  useEffect(() => {
    loadDynamicConfig();
  }, [loadDynamicConfig]);

  // 用户登录后处理数据迁移和加载
  useEffect(() => {
    if (user && configLoaded) {
      checkAndHandleMigration();
      loadUserData();
    }
  }, [user, configLoaded, checkAndHandleMigration, loadUserData]);
  
  /**
   * 获取灰度值辅助函数
   */
  const getGrayValue = useCallback(
    (data: Uint8ClampedArray, index: number): number => {
      const i = index * 4;
      return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    },
    []
  );

  /**
   * 核心图像数据处理函数（原版算法完全复刻）
   */
  const processImageData = useCallback((imageData: ImageData): ImageData => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // 创建边缘检测缓冲区
    const edgeData = new Uint8ClampedArray(data.length);

    // 第一步：边缘检测（Sobel算子）
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // 计算梯度
        const gx =
          (-1 * getGrayValue(data, (y - 1) * width + (x - 1)) +
            1 * getGrayValue(data, (y - 1) * width + (x + 1)) +
            -2 * getGrayValue(data, y * width + (x - 1)) +
            2 * getGrayValue(data, y * width + (x + 1)) +
            -1 * getGrayValue(data, (y + 1) * width + (x - 1)) +
            1 * getGrayValue(data, (y + 1) * width + (x + 1))) /
          8;

        const gy =
          (-1 * getGrayValue(data, (y - 1) * width + (x - 1)) +
            -2 * getGrayValue(data, (y - 1) * width + x) +
            -1 * getGrayValue(data, (y - 1) * width + (x + 1)) +
            1 * getGrayValue(data, (y + 1) * width + (x - 1)) +
            2 * getGrayValue(data, (y + 1) * width + x) +
            1 * getGrayValue(data, (y + 1) * width + (x + 1))) /
          8;

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edgeData[idx] = magnitude;
      }
    }

    // 第二步：主要色彩处理
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 计算亮度（使用标准亮度公式）
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const isEdge = edgeData[i] > (dynamicConfig.filter?.EDGE_THRESHOLD || 30);

      // 基础饱和度大幅降低
      const avgColor = (r + g + b) / 3;
      const desatFactor = dynamicConfig.filter?.DESATURATION || 0.9;
      const desatR = r * (1 - desatFactor) + avgColor * desatFactor;
      const desatG = g * (1 - desatFactor) + avgColor * desatFactor;
      const desatB = b * (1 - desatFactor) + avgColor * desatFactor;

      let finalR, finalG, finalB;

      if (luminance > (dynamicConfig.filter?.HIGHLIGHT_THRESHOLD || 180)) {
        // 高光区域 - 油腻黄绿调
        const highlightThreshold =
          dynamicConfig.filter?.HIGHLIGHT_THRESHOLD || 180;
        const oiliness = (luminance - highlightThreshold) / (255 - highlightThreshold);
        finalR = desatR + oiliness * 40;
        finalG = desatG + oiliness * 35;
        finalB = desatB - oiliness * 20;
      } else if (luminance < (dynamicConfig.filter?.SHADOW_THRESHOLD || 80)) {
        // 阴影区域 - 冷色调（不新鲜感）
        const shadowThreshold = dynamicConfig.filter?.SHADOW_THRESHOLD || 80;
        const coldness = (shadowThreshold - luminance) / shadowThreshold;
        finalR = desatR - coldness * 15;
        finalG = desatG + coldness * 10;
        finalB = desatB + coldness * 25;
      } else {
        // 中间调 - 基础处理
        finalR = desatR;
        finalG = desatG;
        finalB = desatB;
      }

      // 对比度增强
      const contrast = dynamicConfig.filter?.CONTRAST || 1.4;
      finalR = (finalR - 128) * contrast + 128;
      finalG = (finalG - 128) * contrast + 128;
      finalB = (finalB - 128) * contrast + 128;

      // 亮度调整
      const brightness = dynamicConfig.filter?.BRIGHTNESS || 0.75;
      finalR *= brightness;
      finalG *= brightness;
      finalB *= brightness;

      // 边缘保持清晰
      if (isEdge) {
        const edgeSharpness = dynamicConfig.filter?.EDGE_SHARPNESS || 1.2;
        finalR *= edgeSharpness;
        finalG *= edgeSharpness;
        finalB *= edgeSharpness;
      }

      // 确保值在有效范围内
      data[i] = Math.max(0, Math.min(255, finalR));
      data[i + 1] = Math.max(0, Math.min(255, finalG));
      data[i + 2] = Math.max(0, Math.min(255, finalB));
      // Alpha通道保持不变
    }

    return imageData;
  }, [dynamicConfig.filter, getGrayValue]);
  
  /**
   * 完整的恶心滤镜算法（原版一比一复刻）
   */
  const applyCompleteOilyFilter = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const processedData = processImageData(imageData);
      ctx.putImageData(processedData, 0, 0);
    },
    [processImageData]
  );
  
  /**
   * 处理图像文件，应用完整的恶心滤镜（原版算法）
   * 🔥 关键功能：确保生成的processedImageUrl是经过恶心滤镜处理的
   */
  const processImage = useCallback(
    async (file: File): Promise<ImageProcessResult> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = canvasRef.current;

        if (!canvas) {
          reject(new Error('Canvas元素未找到'));
          return;
        }

        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法获取Canvas上下文'));
            return;
          }

          // 设置canvas尺寸（使用配置的最大尺寸）
          const maxSize = CLIENT_CONFIG.image.maxImageSize;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;

          console.log('🖼️ 开始图像处理流程:');
          console.log('  - 原图尺寸:', img.width, 'x', img.height);
          console.log('  - 处理后尺寸:', canvas.width, 'x', canvas.height);

          // 绘制原图
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          console.log('  - ✅ 原图已绘制到Canvas');

          // 🔥 应用完整的恶心滤镜（这是关键步骤）
          applyCompleteOilyFilter(ctx, canvas.width, canvas.height);
          console.log('  - 🎯 恶心滤镜已应用');

          // 生成处理后的图像URL（使用配置的质量）
          const processedImageUrl = canvas.toDataURL(
            'image/jpeg',
            CLIENT_CONFIG.image.imageQuality
          );
          const originalImageUrl = URL.createObjectURL(file);

          // 🔍 验证生成的图片数据
          console.log('  - 原图URL类型:', originalImageUrl.startsWith('blob:') ? 'Blob URL (正确)' : '异常');
          console.log('  - 处理后URL类型:', processedImageUrl.startsWith('data:image/jpeg') ? 'Base64 JPEG (正确)' : '异常');
          console.log('  - 处理后图片大小:', Math.round(processedImageUrl.length / 1024), 'KB');
          
          // 🎯 最终验证：确保我们返回的是正确的数据结构
          const result = {
            processedImageUrl,  // 🔥 这是经过恶心滤镜处理的Base64图片
            originalImageUrl,   // 📸 这是原图的Blob URL（仅用于预览）
          };

          console.log('✅ 图像处理完成，返回结果包含恶心滤镜处理后的图片');
          resolve(result);
        };

        img.onerror = () => reject(new Error('图像加载失败'));
        img.src = URL.createObjectURL(file);
      });
    },
    [applyCompleteOilyFilter]
  );

  /**
   * 处理图片上传（只保存，不立即处理）
   */
  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        // 先处理图像以便预览
        const processedImage = await processImage(file);

        // 保存图片和处理结果到状态，清空之前的会话数据
        setAppState((prev) => ({
          ...prev,
          uploadedImage: file,
          processedImage,
          error: null,
          // 🔥 开始新会话：清空之前的会话ID和聊天历史
          currentSessionId: undefined,
          chatHistory: [],
        }));
      } catch (error) {
        setAppState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : '图片处理失败',
          isLoading: false,
        }));
      }
    },
    [processImage]
  );

  /**
   * 处理减肥理由输入（只保存，不立即处理）
   */
  const handleReasonSubmit = useCallback((reason: string) => {
    setAppState((prev) => ({
      ...prev,
      weightLossReason: reason,
      error: null,
    }));
  }, []);

  /**
   * 带重试机制的AI请求函数
   */
  const fetchAIWithRetry = useCallback(
    async (requestBody: any, attemptCount = 0): Promise<any> => {
      const maxAttempts = dynamicConfig.timing?.aiRetryAttempts || 3;
      const retryDelay = dynamicConfig.timing?.aiRetryDelay || 1000;

      try {
        const response = await authenticatedFetch('/api/generate-text', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          // 特殊处理认证错误
          if (response.status === 401) {
            throw new Error('用户认证失败，请刷新页面重新登录');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.warn(`AI请求失败 (尝试 ${attemptCount + 1}/${maxAttempts}):`, error);

        // 认证错误不重试
        if (error instanceof Error && error.message.includes('认证失败')) {
          throw error;
        }

        if (attemptCount < maxAttempts - 1) {
          // 等待后重试
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return fetchAIWithRetry(requestBody, attemptCount + 1);
        } else {
          // 达到最大重试次数，抛出错误
          throw new Error(`AI服务在 ${maxAttempts} 次重试后仍无法响应`);
        }
      }
    },
    [dynamicConfig.timing, authenticatedFetch]
  );

  /**
   * 生成AI文字内容
   * 🔥 关键功能：确保发送给AI的是经过恶心滤镜处理后的图片
   */
  const generateAIText = useCallback(
    async (
      fileName: string,
      weightLossReason: string,
      imageData?: string  // 这里应该传入处理后的图片Base64数据
    ) => {
      try {
        // 🔍 验证图片数据确实是处理后的（Base64格式）
        if (imageData) {
          console.log('📸 发送给AI的图片数据类型:', imageData.startsWith('data:image/') ? '处理后的Base64图片' : '可能的问题数据');
          console.log('📸 图片数据长度:', imageData.length, '字符');
          console.log('📸 图片数据前50字符:', imageData.substring(0, 50));
        }

        const requestBody = {
          type: 'disgusting',
          userInput: fileName,
          weightLossReason: weightLossReason,
          imageData: imageData, // 🎯 确保这是经过恶心滤镜处理后的图片
          sessionId: appState.currentSessionId,
        };

        console.log('🤖 向AI发送请求，包含处理后图片:', !!imageData);

        const data = await fetchAIWithRetry(requestBody);

        // 更新会话ID（如果API返回了新的会话ID）
        if (data.sessionId && data.sessionId !== appState.currentSessionId) {
          setAppState((prev) => ({
            ...prev,
            currentSessionId: data.sessionId,
          }));
        }

        // 添加到聊天历史
        const aiMessage: ChatMessage = {
          id: generateId(),
          type: 'ai',
          content:
            data.text ||
            dynamicConfig.texts?.disgusting ||
            '请重新考虑这个选择。',
          timestamp: Date.now(),
          isNegative: true,
        };

        setAppState((prev) => ({
          ...prev,
          chatHistory: [aiMessage],
        }));

        return aiMessage;
      } catch (error) {
        console.error('AI文字生成最终失败:', error);

        // 使用配置的默认文本
        const fallbackMessage: ChatMessage = {
          id: generateId(),
          type: 'ai',
          content: `想想您的目标：${weightLossReason}。${
            dynamicConfig.texts?.disgusting || '请重新考虑这个选择。'
          }`,
          timestamp: Date.now(),
          isNegative: true,
        };

        setAppState((prev) => ({
          ...prev,
          chatHistory: [fallbackMessage],
        }));

        return fallbackMessage;
      }
    },
    [fetchAIWithRetry, appState.currentSessionId, dynamicConfig.texts]
  );

  /**
   * 注入饭缩力（智能时间控制版本）
   * 🔥 关键：确保发送给AI的是经过恶心滤镜处理后的图片
   */
  const handleInjectPower = useCallback(async () => {
    if (
      !appState.uploadedImage ||
      !appState.weightLossReason ||
      !appState.processedImage
    ) {
      return;
    }

    const { minWarningTime, maxWarningTime } = dynamicConfig.timing || {
      minWarningTime: 6000,
      maxWarningTime: 12000,
    };

    try {
      // 启动加载状态
      setAppState((prev) => ({ ...prev, isLoading: true }));

      // 🔥 创建新会话（每张图片作为一次对话的开始）
      if (user && !appState.currentSessionId) {
        console.log('🔄 创建新会话...');
        const sessionResponse = await authenticatedFetch('/api/sessions', {
          method: 'POST',
          body: JSON.stringify({
            weightLossReason: appState.weightLossReason,
            originalImageUrl: appState.processedImage.originalImageUrl,
            processedImageUrl: appState.processedImage.processedImageUrl,
          }),
        });

        if (sessionResponse.ok) {
          const { session } = await sessionResponse.json();
          console.log('✅ 新会话已创建:', session.id);
          setAppState((prev) => ({
            ...prev,
            currentSessionId: session.id,
          }));
        } else {
          console.warn('会话创建失败，继续使用本地状态');
        }
      }

      // 🔍 明确验证我们使用的是处理后的图片
      const processedImageUrl = appState.processedImage.processedImageUrl;
      const originalImageUrl = appState.processedImage.originalImageUrl;
      
      console.log('🎯 图片数据验证:');
      console.log('  - 原图URL类型:', originalImageUrl.startsWith('blob:') ? 'Blob URL (原图)' : '其他类型');
      console.log('  - 处理后图片URL类型:', processedImageUrl.startsWith('data:image/') ? 'Base64 (恶心滤镜处理后)' : '可能有问题');
      console.log('  - 将发送给AI的是:', '处理后图片 (processedImageUrl)');

      const startTime = Date.now();
      let aiCompleted = false;

      // 🎯 开始AI生成（异步）- 明确传入处理后的图片
      const aiPromise = generateAIText(
        appState.uploadedImage.name,
        appState.weightLossReason,
        processedImageUrl  // 🔥 明确使用处理后的图片（恶心滤镜）
      )
        .then((result) => {
          aiCompleted = true;
          console.log('✅ AI分析完成，基于恶心滤镜处理后的图片');
          return result;
        })
        .catch((error) => {
          aiCompleted = true; // 即使失败也标记为完成
          console.error('❌ AI分析失败:', error);
          throw error;
        });

      // 智能时间控制逻辑
      const checkAndProceed = async () => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= minWarningTime) {
          // 已满足最少显示时间
          if (aiCompleted) {
            // AI已完成，立即切换
            setAppState((prev) => ({
              ...prev,
              currentStep: 'result',
              isLoading: false,
            }));
            return;
          } else if (elapsed >= maxWarningTime) {
            // 达到最大显示时间，强制切换
            console.log('⏰ 达到最大警示时间，强制切换到结果页面');
            setAppState((prev) => ({
              ...prev,
              currentStep: 'result',
              isLoading: false,
            }));
            // AI继续在后台执行
            return;
          }
        }

        // 继续等待，100ms后再检查
        setTimeout(checkAndProceed, 100);
      };

      // 启动检查循环
      setTimeout(checkAndProceed, 100);

      // 等待AI完成（用于错误处理）
      await aiPromise;
    } catch (error) {
      console.error('注入饭缩力失败:', error);
      setAppState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : '处理失败',
        isLoading: false,
        currentStep: 'result', // 即使出错也切换到结果页面
      }));
    }
  }, [
    appState.uploadedImage,
    appState.weightLossReason,
    appState.processedImage,
    appState.currentSessionId,
    user,
    authenticatedFetch,
    generateAIText,
    dynamicConfig.timing,
  ]);

  /**
   * 处理继续对话
   */
  const handleContinueDialogue = useCallback(
    async (userInput: string) => {
      try {
        // 添加用户消息
        const userMessage: ChatMessage = {
          id: generateId(),
          type: 'user',
          content: userInput,
          timestamp: Date.now(),
        };

        setAppState((prev) => ({
          ...prev,
          chatHistory: [...prev.chatHistory, userMessage],
        }));

        // 生成AI回复（使用重试机制）
        const requestBody = {
          type: 'dialogue',
          userInput: userInput,
          weightLossReason: appState.weightLossReason,
          sessionId: appState.currentSessionId, // 使用当前会话ID
          conversationHistory: [...appState.chatHistory, userMessage],
        };

        const data = await fetchAIWithRetry(requestBody);

        // 更新会话ID（如果API返回了新的会话ID）
        if (data.sessionId && data.sessionId !== appState.currentSessionId) {
          setAppState((prev) => ({
            ...prev,
            currentSessionId: data.sessionId,
          }));
        }

        const aiReply: ChatMessage = {
          id: generateId(),
          type: 'ai',
          content: data.text || '我理解你的想法，但请再想想你的目标。',
          timestamp: Date.now(),
          isNegative: true,
        };

        setAppState((prev) => ({
          ...prev,
          chatHistory: [...prev.chatHistory, aiReply],
        }));
      } catch (error) {
        console.error('继续对话错误:', error);

        // 添加错误消息到聊天历史
        const errorReply: ChatMessage = {
          id: generateId(),
          type: 'ai',
          content: `我暂时无法回应，但请记住你的目标：${appState.weightLossReason}。相信自己的力量。`,
          timestamp: Date.now(),
          isNegative: true,
        };

        setAppState((prev) => ({
          ...prev,
          chatHistory: [...prev.chatHistory, errorReply],
        }));
      }
    },
    [appState.chatHistory, appState.weightLossReason, appState.currentSessionId, fetchAIWithRetry]
  );

  /**
   * 生成激励文字
   */
  const generateMotivatingText = useCallback(async () => {
    try {
      const requestBody = {
        type: 'motivating',
        userInput: '激励自己',
        weightLossReason: appState.weightLossReason,
        sessionId: appState.currentSessionId, // 使用当前会话ID
        conversationHistory: appState.chatHistory,
      };

      const data = await fetchAIWithRetry(requestBody);

      // 更新会话ID（如果API返回了新的会话ID）
      if (data.sessionId && data.sessionId !== appState.currentSessionId) {
        setAppState((prev) => ({
          ...prev,
          currentSessionId: data.sessionId,
        }));
      }

      const motivatingMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content:
          data.text ||
          dynamicConfig.texts?.motivating ||
          '恭喜你做出了正确的选择！',
        timestamp: Date.now(),
        isNegative: false,
      };

      setAppState((prev) => ({
        ...prev,
        chatHistory: [...prev.chatHistory, motivatingMessage],
      }));
    } catch (error) {
      console.error('激励文字生成错误:', error);

      // 使用默认激励文字
      const fallbackMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: `恭喜你战胜了诱惑！为了${appState.weightLossReason}，${
          dynamicConfig.texts?.motivating || '你做出了正确的选择！'
        }`,
        timestamp: Date.now(),
        isNegative: false,
      };

      setAppState((prev) => ({
        ...prev,
        chatHistory: [...prev.chatHistory, fallbackMessage],
      }));
    }
  }, [
    appState.chatHistory,
    appState.weightLossReason,
    appState.currentSessionId,
    fetchAIWithRetry,
    dynamicConfig.texts,
  ]);

  /**
   * 返回到输入界面，但保留结果状态以便恢复
   */
  const handleBack = useCallback(() => {
    setAppState((prev) => ({
      ...prev, // 保留所有现有状态，如processedImage和chatHistory
      currentStep: 'input', // 只改变当前步骤
      isLoading: false,
      error: null,
    }));
  }, [setAppState]);

  /**
   * 从输入界面恢复到上一次的结果页
   */
  const handleResume = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      currentStep: 'result',
    }));
  }, [setAppState]);

  return {
    appState,
    migrationState,
    setMigrationState,
    setAppState,
    canvasRef,
    videoRef,
    handleImageUpload,
    handleReasonSubmit,
    handleInjectPower,
    handleContinueDialogue,
    generateMotivatingText,
    handleBack,
    handleResume,
  };
}; 