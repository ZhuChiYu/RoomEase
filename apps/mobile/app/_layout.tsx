import { useEffect, useRef } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Provider } from 'react-redux'
import { Text, TextInput } from 'react-native'
import { store } from './store'
import { restoreState } from './store/calendarSlice'
import * as Notifications from 'expo-notifications'
import { notificationService, addNotificationResponseListener } from './services/notifications'
import { initializeLocalData } from './services/localDataService'
import { persistedStorage } from './services/storage'
import { apiClient } from './services/apiClient'
import { FEATURE_FLAGS } from './config/environment'

// 禁用字体缩放，忽略系统字体大小设置
// @ts-ignore - Text.defaultProps is not officially typed but works in React Native
if (Text.defaultProps == null) Text.defaultProps = {}
// @ts-ignore
Text.defaultProps.allowFontScaling = false

// @ts-ignore - TextInput.defaultProps is not officially typed but works in React Native
if (TextInput.defaultProps == null) TextInput.defaultProps = {}
// @ts-ignore
TextInput.defaultProps.allowFontScaling = false

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 分钟
      gcTime: 10 * 60 * 1000, // 10 分钟 (formerly cacheTime)
    },
  },
})

// 防止启动画面自动隐藏
SplashScreen.preventAutoHideAsync().catch((err) => {
  console.log('SplashScreen.preventAutoHideAsync() failed - this is expected in some cases', err)
})

export default function RootLayout() {
  const notificationListener = useRef<any>(null)
  const responseListener = useRef<any>(null)

  useEffect(() => {
    // 应用加载完成后隐藏启动画面并初始化通知
    const prepare = async () => {
      try {
        console.log('🚀 App is loading...')
        
        // 1. 初始化本地数据（首次启动时）
        console.log('📦 初始化本地数据存储...')
        try {
          await initializeLocalData()
        } catch (e) {
          console.error('初始化本地数据失败:', e)
        }
        
        // 2. 恢复持久化的Redux状态
        console.log('🔄 恢复应用状态...')
        let persistedState = null
        try {
          persistedState = await persistedStorage.getState()
        } catch (e) {
          console.error('获取持久化状态失败:', e)
        }
        if (persistedState && persistedState.calendar) {
          store.dispatch(restoreState(persistedState.calendar))
          console.log('✅ 状态恢复成功')
        } else {
          console.log('ℹ️ 没有找到持久化状态，使用初始状态')
        }
        
        // 3. 如果使用后端API，自动登录
        if (FEATURE_FLAGS.USE_BACKEND_API) {
          console.log('🔐 使用后端API，自动登录中...')
          try {
            const loginResponse = await apiClient.login('admin@demo.com', '123456')
            if (loginResponse.success) {
              console.log('✅ 自动登录成功:', loginResponse.data)
            } else {
              console.warn('⚠️ 自动登录失败:', loginResponse.error)
            }
          } catch (loginError) {
            console.error('❌ 自动登录错误:', loginError)
          }
        }
        
        // 4. 初始化推送通知
        console.log('🔔 初始化推送通知...')
        const hasPermission = await notificationService.requestPermissions()
        if (hasPermission) {
          const token = await notificationService.getExpoPushToken()
          console.log('📱 Expo push token:', token)
        }
        
        await new Promise(resolve => setTimeout(resolve, 300))
        console.log('✅ App loaded successfully')
      } catch (e) {
        console.error('❌ Error during app initialization:', e)
      } finally {
        try {
          await SplashScreen.hideAsync()
          console.log('👋 SplashScreen hidden')
        } catch (error) {
          console.log('SplashScreen.hideAsync() failed - this is expected in some cases')
        }
      }
    }

    prepare()

    // 监听通知响应
    responseListener.current = addNotificationResponseListener(response => {
      console.log('Notification response received:', response)
      // 可以根据通知数据执行相应的导航或操作
      const data = response.notification.request.content.data
      if (data.type === 'new_reservation') {
        // 导航到预订详情页
        console.log('Navigate to reservation:', data)
      }
    })

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }, [])

  return (
    <Provider store={store}>
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
          <Stack.Screen 
            name="create-order" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="order-details" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="send-sms" 
            options={{ 
              title: '发送短信',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="payment" 
            options={{ 
              title: '添加收款/退款',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="checkout" 
            options={{ 
              title: '办理退房'
            }} 
          />
          <Stack.Screen 
            name="operation-logs" 
            options={{ 
              title: '操作日志',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="sms-rules" 
            options={{ 
              title: '短信内容规则',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="sms-agreement" 
            options={{ 
              title: '短信协议',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="add-consumption" 
            options={{ 
              title: '添加消费',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="close-room" 
            options={{ 
              title: '关房',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="guest-info" 
            options={{ 
              title: '入住人',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="room-type-settings" 
            options={{ 
              title: '房型房间设置',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="edit-room-type" 
            options={{ 
              title: '编辑房型',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="add-rooms" 
            options={{ 
              title: '添加房间',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="edit-order" 
            options={{ 
              title: '修改订单',
              headerShown: false
            }} 
          />
        </Stack>
        <StatusBar style="auto" />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </Provider>
  )
} 