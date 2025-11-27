import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// 配置通知处理器
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// 通知服务
export const notificationService = {
  // 初始化通知权限
  requestPermissions: async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions')
        return false
      }

      // 如果是 Android，设置通知渠道
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        })
      }

      return true
    } catch (error) {
      console.error('Error requesting notification permissions:', error)
      return false
    }
  },

  // 获取推送令牌
  getExpoPushToken: async (): Promise<string | null> => {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data
      await AsyncStorage.setItem('expo_push_token', token)
      return token
    } catch (error) {
      return null
    }
  },

  // 发送本地通知
  scheduleLocalNotification: async (
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> => {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: trigger || null, // null 表示立即发送
    })
    return notificationId
  },

  // 取消通知
  cancelNotification: async (notificationId: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  },

  // 取消所有通知
  cancelAllNotifications: async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync()
  },

  // 获取所有已计划的通知
  getAllScheduledNotifications: async (): Promise<Notifications.NotificationRequest[]> => {
    return await Notifications.getAllScheduledNotificationsAsync()
  },

  // 清除所有已显示的通知
  dismissAllNotifications: async (): Promise<void> => {
    await Notifications.dismissAllNotificationsAsync()
  },

  // 设置通知徽章数
  setBadgeCount: async (count: number): Promise<boolean> => {
    return await Notifications.setBadgeCountAsync(count)
  },

  // 获取通知徽章数
  getBadgeCount: async (): Promise<number> => {
    return await Notifications.getBadgeCountAsync()
  },

  // 预订相关通知
  notifications: {
    // 新预订通知
    newReservation: async (guestName: string, roomNumber: string, checkInDate: string) => {
      return await notificationService.scheduleLocalNotification(
        '新预订',
        `${guestName} 预订了 ${roomNumber}，入住日期：${checkInDate}`,
        { type: 'new_reservation', guestName, roomNumber, checkInDate }
      )
    },

    // 入住提醒
    checkInReminder: async (guestName: string, roomNumber: string) => {
      return await notificationService.scheduleLocalNotification(
        '入住提醒',
        `${guestName} 即将入住 ${roomNumber}`,
        { type: 'check_in_reminder', guestName, roomNumber }
      )
    },

    // 退房提醒
    checkOutReminder: async (guestName: string, roomNumber: string) => {
      return await notificationService.scheduleLocalNotification(
        '退房提醒',
        `${guestName} 即将从 ${roomNumber} 退房`,
        { type: 'check_out_reminder', guestName, roomNumber }
      )
    },

    // 清洁提醒
    cleaningReminder: async (roomNumber: string) => {
      return await notificationService.scheduleLocalNotification(
        '清洁提醒',
        `${roomNumber} 需要清洁`,
        { type: 'cleaning_reminder', roomNumber }
      )
    },

    // 每日汇总
    dailySummary: async (checkins: number, checkouts: number, occupancyRate: number) => {
      return await notificationService.scheduleLocalNotification(
        '每日汇总',
        `今日入住：${checkins}，退房：${checkouts}，入住率：${occupancyRate}%`,
        { type: 'daily_summary', checkins, checkouts, occupancyRate },
        {
          hour: 8,
          minute: 0,
          repeats: true,
        }
      )
    },

    // 支付成功通知
    paymentSuccess: async (guestName: string, amount: number) => {
      return await notificationService.scheduleLocalNotification(
        '收款成功',
        `收到 ${guestName} 的支付 ¥${amount}`,
        { type: 'payment_success', guestName, amount }
      )
    },
  },
}

// 监听通知响应
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback)
}

// 监听前台通知
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback)
}

export default notificationService


