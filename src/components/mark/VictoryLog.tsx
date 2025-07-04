/**
 * 文件功能：胜利回响页面 - 展示用户的历史对话会话
 * 包含的功能：历史会话列表、会话恢复、iOS风格设计
 * 最后修改时间：2024-07-31
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useFoodLessApp } from '@/hooks/useFoodLessApp';

// 会话数据类型定义
interface Session {
  id: string;
  weight_loss_reason: string;
  original_image_url?: string;
  processed_image_url?: string;
  created_at: string;
  metadata: any;
}

export default function VictoryLog() {
  const { session } = useAuth();
  const router = useRouter();
  const { setAppState } = useFoodLessApp();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 认证fetch函数
   */
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      throw new Error('用户认证失败，请重新登录');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  /**
   * 加载历史会话列表
   */
  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('/api/sessions?limit=50');
      
      if (!response.ok) {
        throw new Error('获取历史记录失败');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('加载历史会话失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 恢复历史会话
   */
  const restoreSession = async (sessionData: Session) => {
    try {
      // 获取该会话的完整对话历史
      const conversationResponse = await authenticatedFetch(`/api/conversations/${sessionData.id}`);
      
      if (!conversationResponse.ok) {
        throw new Error('获取对话历史失败');
      }

      const { conversations } = await conversationResponse.json();

      // 转换为应用状态格式
      const chatHistory = conversations.map((conv: any) => ({
        id: conv.id,
        type: conv.message_type,
        content: conv.content,
        timestamp: new Date(conv.created_at).getTime(),
        isNegative: conv.is_negative,
      }));

      // 恢复应用状态
      setAppState({
        currentStep: 'result',
        isLoading: false,
        error: null,
        processedImage: sessionData.processed_image_url ? {
          processedImageUrl: sessionData.processed_image_url,
          originalImageUrl: sessionData.original_image_url || '',
        } : null,
        chatHistory,
        uploadedImage: undefined, // 历史会话没有原始文件对象
        weightLossReason: sessionData.weight_loss_reason,
        currentSessionId: sessionData.id,
      });

      // 跳转到首页（会自动显示结果页面）
      router.push('/');
    } catch (err) {
      console.error('恢复会话失败:', err);
      alert('恢复对话失败，请稍后重试');
    }
  };

  /**
   * 格式化时间显示
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    if (session) {
      loadSessions();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
        <p className="text-gray-500">加载历史记录中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadSessions}
          className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <i className="fas fa-history text-gray-400 text-4xl mb-4"></i>
        <h3 className="text-lg font-medium text-gray-600 mb-2">暂无历史记录</h3>
        <p className="text-gray-500 text-center">
          当您使用饭缩力分析食物后<br />
          历史记录将在这里显示
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">胜利回响</h2>
        <span className="text-sm text-gray-500">{sessions.length} 条记录</span>
      </div>

      {/* 历史记录列表 */}
      <div className="space-y-3">
        {sessions.map((sessionData) => (
          <div
            key={sessionData.id}
            onClick={() => restoreSession(sessionData)}
            className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-start space-x-3">
              {/* 图片缩略图 */}
              <div className="flex-shrink-0">
                {sessionData.processed_image_url ? (
                  <img
                    src={sessionData.processed_image_url}
                    alt="食物图片"
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <i className="fas fa-image text-gray-400"></i>
                  </div>
                )}
              </div>

              {/* 会话信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sessionData.weight_loss_reason}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(sessionData.created_at)}
                    </p>
                  </div>
                  <i className="fas fa-chevron-right text-gray-300 text-sm ml-2 mt-1"></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="text-center pt-6">
        <p className="text-xs text-gray-400">
          点击任意记录可恢复之前的对话
        </p>
      </div>
    </div>
  );
} 