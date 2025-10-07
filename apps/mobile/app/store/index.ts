import { configureStore, Middleware } from '@reduxjs/toolkit'
import calendarReducer from './calendarSlice'
import { persistedStorage } from '../services/storage'

// 数据持久化中间件 - 每次状态变化后自动保存到本地
const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)
  
  // 获取更新后的状态
  const state = store.getState()
  
  // 异步保存到本地存储（不阻塞主线程）
  // 使用防抖机制避免频繁写入
  if (persistenceMiddleware.timeoutId) {
    clearTimeout(persistenceMiddleware.timeoutId)
  }
  
  persistenceMiddleware.timeoutId = setTimeout(() => {
    persistedStorage.saveState(state).catch((error) => {
      console.error('Failed to persist state:', error)
    })
  }, 500) // 500ms防抖
  
  return result
}

// 给middleware添加timeoutId属性用于防抖
;(persistenceMiddleware as any).timeoutId = null

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略某些action的序列化检查
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(persistenceMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// 导出恢复状态的辅助函数
export const restorePersistedState = async () => {
  try {
    const persistedState = await persistedStorage.getState()
    if (persistedState) {
      console.log('🔄 恢复持久化状态...')
      return persistedState
    }
  } catch (error) {
    console.error('Failed to restore persisted state:', error)
  }
  return null
}

