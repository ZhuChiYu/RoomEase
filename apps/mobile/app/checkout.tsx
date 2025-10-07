import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'

export default function CheckoutScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  
  const { orderId, guestName, roomType, checkInDate, totalAmount, paidAmount, remainingAmount } = params

  const [selectedRoom, setSelectedRoom] = useState(true)
  const [checkoutNotes, setCheckoutNotes] = useState('')

  const handleCheckout = () => {
    if (Number(remainingAmount) > 0) {
      Alert.alert(
        '提示',
        `还有¥${Number(remainingAmount).toFixed(2)}未收款，确定要退房吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定退房',
            onPress: () => {
              Alert.alert(
                '退房成功',
                '房间已成功办理退房',
                [
                  {
                    text: '确定',
                    onPress: () => router.back()
                  }
                ]
              )
            }
          }
        ]
      )
    } else {
      Alert.alert(
        '退房成功',
        '房间已成功办理退房',
        [
          {
            text: '确定',
            onPress: () => router.back()
          }
        ]
      )
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 房间信息 */}
        <View style={styles.card}>
          <View style={styles.roomRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setSelectedRoom(!selectedRoom)}
            >
              {selectedRoom && <View style={styles.checkboxActive} />}
            </TouchableOpacity>
            <View style={styles.roomInfo}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomTitle}>{roomType}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>已入住</Text>
                </View>
              </View>
              <Text style={styles.roomDetail}>
                {checkInDate} 入住，共 1 晚
              </Text>
              <Text style={styles.roomPrice}>¥{Number(totalAmount).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* 金额汇总 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>订单总额：</Text>
            <Text style={styles.summaryValue}>¥{Number(totalAmount).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>收款总额：</Text>
            <Text style={[styles.summaryValue, { color: '#f39c12' }]}>
              ¥{Number(paidAmount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>还需收款：</Text>
            <Text style={[styles.summaryValue, { color: '#e74c3c', fontSize: 20 }]}>
              ¥{Number(remainingAmount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* 退房备注 */}
        <View style={styles.card}>
          <Text style={styles.label}>请输入办理退房备注</Text>
          <TextInput
            style={styles.textArea}
            placeholder=""
            value={checkoutNotes}
            onChangeText={setCheckoutNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.footer}>
        <View style={styles.selectedInfo}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={() => setSelectedRoom(!selectedRoom)}
          >
            <View style={styles.checkbox}>
              {selectedRoom && <View style={styles.checkboxActive} />}
            </View>
            <Text style={styles.selectAllText}>全选 共 1 间</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>办理退房(1)</Text>
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
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  roomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  checkboxActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4a90e2',
  },
  roomInfo: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  roomDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedInfo: {
    flex: 1,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
})

