/**
 * 文件功能：饭缩力主页面组件
 * 包含的组件：FoodLessApp、路由保护
 * 最后修改时间：2024-12-21
 */

import FoodLessApp from '@/components/FoodLessApp'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

/**
 * 主页面组件
 * 饭缩力应用的入口页面。AuthProvider已移至全局layout。
 * @returns JSX元素
 */
export default function HomePage() {
  return (
      <ProtectedRoute>
        <FoodLessApp />
      </ProtectedRoute>
  )
} 