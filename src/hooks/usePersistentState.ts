/**
 * 文件功能：提供一个能够将会话状态持久化到sessionStorage的React Hook
 * 包含的函数：usePersistentState
 * 最后修改时间：2024-07-31
 */
import { useState, useEffect } from 'react';

/**
 * 一个自定义Hook，用于将状态持久化到sessionStorage中。
 * 它类似于useState，但会在状态变化时自动保存到sessionStorage，
 * 并在组件初始化时从sessionStorage中恢复状态。
 * @param key - 在sessionStorage中存储该状态所使用的键。
 * @param initialState - 如果sessionStorage中没有值，则使用的初始状态。
 * @returns 返回一个状态值和更新该状态的函数，与useState的API一致。
 */
function usePersistentState<T>(key: string, initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    // 在服务器端渲染（SSR）期间，window对象不存在，直接返回初始状态
    if (typeof window === 'undefined') {
      return initialState;
    }
    try {
      // 尝试从sessionStorage中获取已存储的状态
      const storedValue = window.sessionStorage.getItem(key);
      // 如果找到了，就解析它；否则，返回初始状态
      return storedValue ? JSON.parse(storedValue) : initialState;
    } catch (error) {
      // 如果解析出错，打印错误并返回初始状态
      console.error(`Error reading sessionStorage key “${key}”:`, error);
      return initialState;
    }
  });

  useEffect(() => {
    // 当state变化时，将其序列化为JSON并存入sessionStorage
    try {
      // 同样，确保只在客户端执行
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      // 如果存储出错，打印错误
      console.error(`Error writing to sessionStorage key “${key}”:`, error);
    }
  }, [key, state]); // 依赖项数组，确保只有在key或state变化时才执行

  return [state, setState];
}

export default usePersistentState; 