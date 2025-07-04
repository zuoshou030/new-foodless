'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/supabase/database';
import type { UserVow } from '@/types';

/**
 * 文件功能：核心誓言编辑器
 * 包含的功能：查看、编辑、保存核心誓言（含图片上传）
 * 最后修改时间：2024-12-20
 */
export default function VowEditor() {
  const { user, session } = useAuth();
  const [vow, setVow] = useState<UserVow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑模式的状态
  const [editText, setEditText] = useState('');
  const [editMotivation, setEditMotivation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // 新增：AI生成相关状态
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiMotivation, setAiMotivation] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🔧 添加缓存控制
  const lastFetchedUserId = useRef<string | null>(null);
  const hasInitialized = useRef(false);

  // 🔧 使用useCallback优化fetchVow函数
  const fetchVow = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      console.log('🔍 用户未登录，跳过获取誓言');
      setIsLoading(false);
      return;
    }

    // 🔧 防止重复获取相同用户的数据
    if (!forceRefresh && lastFetchedUserId.current === user.id && hasInitialized.current) {
      console.log('🔧 数据已缓存，跳过重复获取', user.id);
      return;
    }

    try {
      console.log('🔍 开始获取用户誓言，用户ID:', user.id);
      setIsLoading(true);
      const data = await db.getUserVow(user.id);
      console.log('🔍 从数据库获取的誓言数据:', data);
      
      setVow(data);
      lastFetchedUserId.current = user.id; // 🔧 记录已获取的用户ID
      hasInitialized.current = true; // 🔧 标记已初始化
      
      if (data) {
        console.log('✅ 找到已有誓言，设置编辑状态');
        console.log('✅ 誓言文本:', data.vow_text);
        console.log('✅ 激励文案:', data.motivational_text);
        console.log('✅ 图片URL:', data.image_url);
        setEditText(data.vow_text);
        setEditMotivation(data.motivational_text || '');
        setPreviewUrl(data.image_url);
        // 注意：这里我们不自动加载旧的AI文案，让用户每次都有新鲜感
        console.log('✅ 设置预览URL为:', data.image_url);
      } else {
        console.log('ℹ️ 用户暂无誓言，进入编辑模式');
        setIsEditing(true); // 新用户，直接进入编辑模式
      }
    } catch (err) {
      console.error('❌ 获取誓言失败:', err);
      setError('获取您的誓言时出错，请稍后重试。');
    } finally {
      setIsLoading(false);
      console.log('🔍 誓言获取流程结束');
    }
  }, [user?.id]);

  // 🔧 优化useEffect，减少不必要的触发
  useEffect(() => {
    if (user?.id && (!hasInitialized.current || lastFetchedUserId.current !== user.id)) {
      fetchVow();
    } else if (!user?.id) {
      // 用户登出时重置状态
      setVow(null);
      setIsLoading(false);
      hasInitialized.current = false;
      lastFetchedUserId.current = null;
    }
  }, [user?.id, fetchVow]);

  // 新增：AI生成激励文案的函数
  const handleGenerateAIMotivation = async () => {
    if (!editText.trim() || isGeneratingAI) return;

    setIsGeneratingAI(true);
    setAiMotivation(null); // 清空旧内容
    setError(null);

    try {
      const response = await fetch('/api/vow/generate-motivation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ vowText: editText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI文案生成失败');
      }

      const result = await response.json();
      setAiMotivation(result.motivation);

    } catch (err: any) {
      setError(err.message || 'AI服务暂时不可用');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // 简单的文件大小和类型检查
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('图片大小不能超过5MB');
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!user || !editText.trim() || isSaving) return;
    
    console.log('🔍 开始保存誓言...');
    console.log('🔍 用户ID:', user.id);
    console.log('🔍 誓言文本:', editText);
    console.log('🔍 激励文案:', editMotivation);
    console.log('🔍 是否有新图片:', !!imageFile);
    console.log('🔍 当前图片URL:', vow?.image_url);
    
    setIsSaving(true);
    setError(null);
    let imageUrl = vow?.image_url || null;

    try {
      // 1. 如果有新图片，先上传图片
      if (imageFile) {
        console.log('🔍 开始上传新图片...');
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch('/api/vow/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session?.access_token}` },
            body: formData,
        });

        console.log('🔍 图片上传响应状态:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ 图片上传失败:', errorData);
            throw new Error(errorData.error || '图片上传失败');
        }
        
        const result = await response.json();
        console.log('✅ 图片上传响应:', result);
        imageUrl = result.imageUrl;
        console.log('✅ 获得图片URL:', imageUrl);
      }

      // 2. 保存誓言文本和图片URL
      console.log('🔍 开始保存到数据库...');
      console.log('🔍 保存数据:', {
          vow_text: editText,
          motivational_text: editMotivation,
          image_url: imageUrl,
          ai_motivational_text: aiMotivation,
      });
      
      const updatedVow = await db.upsertUserVow(user.id, {
          vow_text: editText,
          motivational_text: editMotivation,
          image_url: imageUrl,
          ai_motivational_text: aiMotivation,
      });

      console.log('🔍 数据库保存结果:', updatedVow);

      if (updatedVow) {
          console.log('✅ 保存成功，更新前端状态');
          console.log('✅ 新的誓言数据:', updatedVow);
          setVow(updatedVow);
          setPreviewUrl(updatedVow.image_url); // 更新预览URL
          console.log('✅ 设置预览URL为:', updatedVow.image_url);
          setImageFile(null); // 清空已上传的文件
          setAiMotivation(null); // 清空AI文案状态
          setIsEditing(false);
          console.log('✅ 退出编辑模式');
          
          // 🔧 标记数据已更新，防止重新获取
          lastFetchedUserId.current = user.id;
      } else {
          console.error('❌ 数据库保存失败，返回空数据');
          throw new Error('保存誓言失败');
      }
    } catch (err: any) {
        console.error('❌ 保存过程中出错:', err);
        setError(err.message || '保存失败，请稍后重试');
    } finally {
        setIsSaving(false);
        console.log('🔍 保存流程结束');
    }
  };
  
  const handleCancel = () => {
    if (vow) {
        // 如果之前有誓言，恢复到之前的数据
        setEditText(vow.vow_text);
        setEditMotivation(vow.motivational_text || '');
        setPreviewUrl(vow.image_url);
        setImageFile(null);
        setIsEditing(false);
    } else {
        // 如果是新用户取消，可以考虑返回上一页或显示提示
    }
    setError(null);
  }

  // 🔧 添加手动刷新功能（用于调试）
  const handleRefresh = () => {
    console.log('🔄 手动刷新誓言数据');
    fetchVow(true);
  };

  if (isLoading && !hasInitialized.current) {
    return (
      <div className="bg-white rounded-2xl shadow-lg mx-4 mt-4">
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          加载核心誓言...
        </div>
      </div>
    );
  }

  // 编辑模式
  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg mx-4 mt-4">
        <div className="text-center pt-8 pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {vow ? '编辑核心誓言' : '设定你的核心誓言'}
          </h2>
          <div className="w-32 border-b-2 border-gray-800 mx-auto mt-2"></div>
        </div>
        
        <div className="px-8 pb-8">
          <div className="space-y-6">
            {/* 誓言文本输入 */}
            <div>
              <label htmlFor="vowText" className="block text-sm font-medium text-gray-700 mb-2">
                你的誓言 (例如：为了创业，获得财富)
              </label>
              <input 
                id="vowText" 
                type="text" 
                value={editText} 
                onChange={(e) => setEditText(e.target.value)} 
                placeholder="写下你坚持的最终动力" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>

            {/* 图片上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">激励图片</label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="誓言图片预览" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="px-4 py-2 border rounded-xl text-gray-700 hover:bg-gray-100 transition whitespace-nowrap"
                >
                  选择图片
                </button>
              </div>
            </div>
            
            {/* 激励文本输入 */}
            <div>
              <label htmlFor="motivationText" className="block text-sm font-medium text-gray-700 mb-2">
                激励自己的话 (可选)
              </label>
              <textarea 
                id="motivationText" 
                value={editMotivation} 
                onChange={(e) => setEditMotivation(e.target.value)} 
                rows={4} 
                placeholder="写一段话，在动摇时提醒自己" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>

            {/* AI生成激励文案 */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                来自AI的智慧
              </label>
              {aiMotivation ? (
                <div className="bg-gray-100 p-4 rounded-xl text-gray-800 italic">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-4" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold not-italic" {...props} />,
                    }}
                  >
                    {`"${aiMotivation}"`}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  {isGeneratingAI ? '正在为你汲取灵感...' : '输入你的誓言后，让AI给你一些启发'}
                </div>
              )}
              <button
                onClick={handleGenerateAIMotivation}
                disabled={!editText.trim() || isGeneratingAI}
                className="w-full mt-3 px-4 py-2 border rounded-xl text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></span>
                    生成中...
                  </span>
                ) : '获得AI启发'}
              </button>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

          <div className="flex items-center justify-end space-x-4 mt-8">
            <button 
              onClick={handleCancel} 
              disabled={isSaving} 
              className="px-6 py-2 border rounded-xl text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
            >
              取消
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || !editText.trim()} 
              className="px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 查看模式
  return (
    <div className="bg-white rounded-2xl shadow-lg mx-4 mt-4 relative">
      <div className="text-center pt-8 pb-4">
        <h2 className="text-xl font-bold text-gray-800">核心誓言</h2>
        <div className="w-32 border-b-2 border-gray-800 mx-auto mt-2"></div>
      </div>

      {vow ? (
        <div className="px-8 pb-8">
          {/* 编辑按钮 */}
          <button 
            onClick={() => setIsEditing(true)} 
            className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"
            aria-label="编辑核心誓言"
          >
            <Pencil size={20} />
          </button>

          {/* 誓言文字 */}
          <div className="text-center mb-6">
            <p className="text-amber-500 text-2xl font-semibold whitespace-pre-wrap">
              {vow.vow_text}
            </p>
          </div>
          
          {/* 激励图片 */}
          <div className="w-full max-w-sm mx-auto mb-6">
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
              {(() => {
                console.log('🖼️ 渲染图片组件，vow.image_url:', vow.image_url);
                return vow.image_url ? (
                  <img 
                    src={vow.image_url} 
                    alt="核心誓言激励图片" 
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('✅ 图片加载成功:', vow.image_url)}
                    onError={(e) => {
                      console.error('❌ 图片加载失败:', vow.image_url);
                      console.error('❌ 错误详情:', e);
                    }}
                  />
                ) : (
                  <p className="text-gray-400">未设置激励图片</p>
                );
              })()}
            </div>
          </div>

          {/* 激励文案 */}
          {vow.motivational_text && (
            <div className="text-center my-6">
              <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                {vow.motivational_text}
              </p>
            </div>
          )}

          {/* AI生成的文案展示 */}
          {vow.ai_motivational_text && (
             <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="bg-gradient-to-tr from-gray-50 to-gray-100 p-6 rounded-2xl text-left text-gray-800 italic shadow-inner">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-4" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold not-italic" {...props} />,
                    }}
                  >
                    {`"${vow.ai_motivational_text}"`}
                  </ReactMarkdown>
                </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 px-8">
          <p className="text-gray-500 mb-2">你的核心誓言是指导你前行的灯塔。</p>
          <p className="text-gray-500 mb-6">设定一个，让它在迷茫时给你力量。</p>
          <button 
            onClick={() => setIsEditing(true)} 
            className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-semibold"
          >
            立即设定
          </button>
        </div>
      )}
    </div>
  );
} 