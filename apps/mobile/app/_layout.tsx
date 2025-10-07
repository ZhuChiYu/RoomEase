import { useEffect, useRef } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Provider } from 'react-redux'
import { store } from './store'
import * as Notifications from 'expo-notifications'
import { notificationService, addNotificationResponseListener } from './services/notifications'

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
SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('SplashScreen.preventAutoHideAsync() failed - this is expected in some cases')
})

export default function RootLayout() {
  const notificationListener = useRef<any>()
  const responseListener = useRef<any>()

  useEffect(() => {
    // 应用加载完成后隐藏启动画面并初始化通知
    const prepare = async () => {
      try {
        // 这里可以添加字体加载、API 初始化等
        console.log('App is loading...')
        
        // 初始化推送通知
        const hasPermission = await notificationService.requestPermissions()
        if (hasPermission) {
          const token = await notificationService.getExpoPushToken()
          console.log('Expo push token:', token)
        }
        
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('App loaded successfully')
      } catch (e) {
        console.warn('Error during app initialization:', e)
      } finally {
        try {
          await SplashScreen.hideAsync()
          console.log('SplashScreen hidden')
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
        </Stack>
        <StatusBar style="auto" />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </Provider>
  )
} 