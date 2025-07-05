'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import VowEditor from '@/components/mark/VowEditor';
import VictoryLog from '@/components/mark/VictoryLog';
import CommitmentEditor from '@/components/mark/CommitmentEditor';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppHeader from '@/components/AppHeader';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 stable-scrollbar">
      {/* 顶部导航 */}
      <AppHeader hrefpath="/" showTitle={false}/>

      {/* 主要内容区域 */}
      <div className="mt-0">
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