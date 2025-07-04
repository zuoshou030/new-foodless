'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import VowEditor from '@/components/mark/VowEditor';
import VictoryLog from '@/components/mark/VictoryLog';
import CommitmentEditor from '@/components/mark/CommitmentEditor';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function MarkContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');

  const renderSection = () => {
    switch (section) {
      case 'vow':
        return <VowEditor />;
      case 'log':
        return <VictoryLog />;
      case 'commitment':
        return <CommitmentEditor />;
      default:
        // 默认显示核心誓言
        return <VowEditor />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between p-4">
        {/* 返回按钮 */}
        <Link href="/" passHref>
          <button className="flex items-center justify-center w-12 h-12 bg-white rounded-full border-2 border-gray-200 hover:shadow-md transition-all">
            <i className="fas fa-arrow-left text-gray-700"></i>
          </button>
        </Link>

        {/* 页面标题 */}
        <h1 className="text-2xl font-bold text-gray-800">饭缩力</h1>

        {/* 用户头像占位 */}
        <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full border-2 border-gray-200">
          <i className="fas fa-user text-gray-500"></i>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="px-4">
        {renderSection()}
      </div>
    </div>
  );
}

const MarkPage = () => {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-500">加载中...</div>
          </div>
        </div>
      }>
        <MarkContent />
      </Suspense>
    </ProtectedRoute>
  );
};

export default MarkPage; 