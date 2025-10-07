import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActionSheetIOS,
  Platform,
  StatusBar,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAppDispatch } from './store/hooks'
import { cancelReservation } from './store/calendarSlice'

export default function OrderDetailsScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const params = useLocalSearchParams()
  
  const {
    orderId,
    guestName,
    guestPhone,
    channel,
    checkInDate,
    checkOutDate,
    roomType,
    roomPrice,
    guestCount,
    nights,
    totalAmount,
  } = params

  const [orderStatus, setOrderStatus] = useState('进行中')
  const [paidAmount, setPaidAmount] = useState(0)
  const [otherFees, setOtherFees] = useState(0)
  const [menuVisible, setMenuVisible] = useState(false)

  const remainingAmount = Number(totalAmount) - paidAmount
  const totalReceivable = Number(totalAmount) + otherFees

  // 拨打电话
  const handleCall = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: `呼叫 ${guestPhone} 的方式`,
          options: ['取消', '主号', '数据流量'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            makeCall('primary')
          } else if (buttonIndex === 2) {
            makeCall('data')
          }
        }
      )
    } else {
      makeCall('primary')
    }
  }

  const makeCall = async (type: 'primary' | 'data') => {
    try {
      const phoneUrl = `tel:${guestPhone}`
      const supported = await Linking.canOpenURL(phoneUrl)
      
      if (supported) {
        await Linking.openURL(phoneUrl)
      } else {
        Alert.alert('错误', '设备不支持拨打电话功能')
      }
    } catch (error) {
      Alert.alert('错误', '拨打电话失败')
    }
  }

  // 发送短信
  const handleSendSMS = () => {
    router.push({
      pathname: '/send-sms',
      params: {
        orderId,
        guestName,
        guestPhone,
      }
    })
  }

  // 添加收款/退款
  const handlePayment = () => {
    router.push({
      pathname: '/payment',
      params: {
        orderId,
        guestName,
        totalAmount,
        paidAmount: paidAmount.toString(),
        remainingAmount: remainingAmount.toString(),
      }
    })
  }

  // 办理退房
  const handleCheckout = () => {
    router.push({
      pathname: '/checkout',
      params: {
        orderId,
        guestName,
        roomType,
        checkInDate,
        totalAmount,
        paidAmount: paidAmount.toString(),
        remainingAmount: remainingAmount.toString(),
      }
    })
  }

  // 查看操作日志
  const handleViewLogs = () => {
    router.push({
      pathname: '/operation-logs',
      params: {
        orderId,
      }
    })
  }

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>订单</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* 菜单弹出层 */}
      {menuVisible && (
        <>
          <TouchableOpacity 
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menuPopup}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                Alert.alert('修改订单', '修改订单功能开发中')
              }}
            >
              <Text style={styles.menuItemText}>修改订单</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                Alert.alert(
                  '取消预订',
                  '确定要取消此订单吗？',
                  [
                    { text: '取消', style: 'cancel' },
                    { 
                      text: '确定', 
                      onPress: () => {
                        // 取消Redux中的预订
                        const reservationId = `RES_${orderId}`
                        dispatch(cancelReservation(reservationId))
                        
                        Alert.alert('已取消', '订单已取消', [
                          {
                            text: '确定',
                            onPress: () => {
                              // 跳转回房态日历页
                              router.replace('/(tabs)/calendar')
                            }
                          }
                        ])
                      }
                    }
                  ]
                )
              }}
            >
              <Text style={styles.menuItemText}>取消预订</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                Alert.alert(
                  '取消排房',
                  '确定要取消排房吗？',
                  [
                    { text: '取消', style: 'cancel' },
                    { text: '确定', onPress: () => Alert.alert('已取消', '排房已取消') }
                  ]
                )
              }}
            >
              <Text style={styles.menuItemText}>取消排房</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                Alert.alert('移入单箱盒子', '移入单箱盒子功能开发中')
              }}
            >
              <Text style={styles.menuItemText}>移入单箱盒子</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Tab 切换 */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>订单详情</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={handleViewLogs}>
          <Text style={styles.tabText}>操作日志</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 客人信息卡片 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.guestName}>{guestName} {guestPhone}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{orderStatus}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleSendSMS}>
              <Text style={styles.iconButtonIcon}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleCall}>
              <Text style={styles.iconButtonIcon}>📞</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{channel}</Text>
            </View>
          </View>
        </View>

        {/* 房间总额 */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>房间总额：</Text>
          <Text style={styles.amountValue}>¥{Number(totalAmount).toFixed(2)}</Text>
          <Text style={styles.amountDetail}>共{nights}晚，消耗{nights}间夜</Text>
        </View>

        {/* 房间信息 */}
        <View style={styles.card}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomTitle}>{roomType}</Text>
            <View style={styles.roomStatusBadge}>
              <Text style={styles.roomStatusText}>已入住</Text>
            </View>
          </View>
          
          <View style={styles.roomInfo}>
            <Text style={styles.roomInfoText}>{checkInDate} 入住，共 {nights} 晚</Text>
            <Text style={styles.roomPrice}>¥{Number(roomPrice).toFixed(2)}</Text>
          </View>

          <TouchableOpacity 
            style={styles.guestCountRow}
            onPress={() => {
              router.push({
                pathname: '/guest-info',
                params: {
                  name: guestName as string,
                  phone: guestPhone as string,
                  idType: '身份证',
                  idNumber: '',
                }
              })
            }}
          >
            <Text style={styles.guestCountLabel}>入住人</Text>
            <Text style={styles.guestCountValue}>{guestName || '未添加'} ›</Text>
          </TouchableOpacity>
        </View>

        {/* 其他消费 */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>其他消费：¥{otherFees.toFixed(2)}</Text>
            <TouchableOpacity onPress={() => router.push({
              pathname: '/add-consumption',
              params: { orderId }
            })}>
              <Text style={styles.addButton}>⊕ 添加消费</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 收款总额 */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>收款总额：¥{paidAmount.toFixed(2)}</Text>
            <TouchableOpacity onPress={handlePayment}>
              <Text style={styles.addButton}>⊕ 收款/退款</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 还需收款 */}
        <View style={styles.remainingCard}>
          <Text style={styles.remainingLabel}>还需收款：</Text>
          <Text style={styles.remainingAmount}>¥{remainingAmount.toFixed(2)}</Text>
        </View>

        {/* 订单提醒 */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>订单提醒</Text>
            <TouchableOpacity>
              <Text style={styles.addButton}>⊕ 添加提醒</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>办理退房</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  menuButton: {
    padding: 4,
  },
  menuText: {
    fontSize: 24,
    color: '#333',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  menuPopup: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a90e2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonIcon: {
    fontSize: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#1976d2',
  },
  amountCard: {
    backgroundColor: '#f8f9fa',
    marginTop: 12,
    padding: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 4,
  },
  amountDetail: {
    fontSize: 12,
    color: '#999',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roomStatusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roomStatusText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  roomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomInfoText: {
    fontSize: 13,
    color: '#666',
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  guestCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  guestCountLabel: {
    fontSize: 14,
    color: '#666',
  },
  guestCountValue: {
    fontSize: 14,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    fontSize: 14,
    color: '#4a90e2',
  },
  remainingCard: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
    alignItems: 'flex-end',
  },
  remainingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  remainingAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  checkoutButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
})

