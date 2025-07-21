import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 分钟
      cacheTime: 10 * 60 * 1000, // 10 分钟
    },
  },
})

// 防止启动画面自动隐藏
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    // 应用加载完成后隐藏启动画面
    const prepare = async () => {
      try {
        // 这里可以添加字体加载、API 初始化等
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e) {
        console.warn(e)
      } finally {
        await SplashScreen.hideAsync()
      }
    }

    prepare()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#6366f1',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="auth/login" 
            options={{ 
              title: '登录',
              presentation: 'modal' 
            }} 
          />
          <Stack.Screen 
            name="revenue-details" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="booking-details" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="rooms" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="reservation/[id]" 
            options={{ 
              title: '预订详情' 
            }} 
          />
          <Stack.Screen 
            name="camera/id-recognition" 
            options={{ 
              title: '身份证识别',
              presentation: 'modal' 
            }} 
          />
          <Stack.Screen 
            name="camera/id-scan" 
            options={{ 
              headerShown: false,
              presentation: 'modal' 
            }} 
          />
        </Stack>
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </QueryClientProvider>
  )
} 