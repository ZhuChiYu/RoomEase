import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { DateWheelPicker } from './components/DateWheelPicker'

export default function PaymentScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  
  const { orderId, guestName, totalAmount, paidAmount, remainingAmount } = params

  const [activeTab, setActiveTab] = useState<'payment' | 'refund'>('payment')
  const [paymentType, setPaymentType] = useState('收款')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [amount, setAmount] = useState(remainingAmount || '0')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [datePickerVisible, setDatePickerVisible] = useState(false)

  const handleSubmit = () => {
    if (!paymentMethod) {
      Alert.alert('提示', '请选择收款方式')
      return
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert('提示', '请输入有效金额')
      return
    }

    const actionText = activeTab === 'payment' ? '收款' : '退款'
    Alert.alert(
      `${actionText}成功`,
      `已添加${actionText}记录\n金额：¥${amount}`,
      [
        {
          text: '确定',
          onPress: () => router.back()
        }
      ]
    )
  }

  const handleDateSelect = (date: string) => {
    setPaymentDate(date)
  }

  const paymentMethods = ['现金', '微信', '支付宝', '银行卡', '美团', '携程']

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>添加收款/退款</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab 切换 */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payment' && styles.activeTab]}
          onPress={() => setActiveTab('payment')}
        >
          <Text style={[styles.tabText, activeTab === 'payment' && styles.activeTabText]}>
            收款
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'refund' && styles.activeTab]}
          onPress={() => setActiveTab('refund')}
        >
          <Text style={[styles.tabText, activeTab === 'refund' && styles.activeTabText]}>
            退款
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 金额信息 */}
        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>订单金额</Text>
            <Text style={styles.amountValue}>¥{Number(totalAmount).toFixed(2)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>已付金额</Text>
            <Text style={[styles.amountValue, { color: '#f39c12' }]}>
              ¥{Number(paidAmount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>还需付款</Text>
            <Text style={[styles.amountValue, { color: '#e74c3c' }]}>
              ¥{Number(remainingAmount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* 表单 */}
        <View style={styles.form}>
          <View style={styles.formRow}>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setPaymentType('收款')}
              >
                <View style={[styles.radio, paymentType === '收款' && styles.radioActive]}>
                  {paymentType === '收款' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>收款</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setPaymentType('收押金')}
              >
                <View style={[styles.radio, paymentType === '收押金' && styles.radioActive]}>
                  {paymentType === '收押金' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>收押金</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.formRow}>
            <Text style={styles.formLabel}>收款方式</Text>
            <Text style={styles.formValue}>
              {paymentMethod || '请选择收款方式'} ›
            </Text>
          </TouchableOpacity>

          {/* 收款方式选择 */}
          <View style={styles.methodGrid}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.methodButton,
                  paymentMethod === method && styles.methodButtonActive
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[
                  styles.methodButtonText,
                  paymentMethod === method && styles.methodButtonTextActive
                ]}>
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>金额</Text>
            <TextInput
              style={styles.formInput}
              placeholder="请输入金额"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <TouchableOpacity
            style={styles.formRow}
            onPress={() => setDatePickerVisible(true)}
          >
            <Text style={styles.formLabel}>收款日期</Text>
            <Text style={styles.formValue}>{paymentDate} ›</Text>
          </TouchableOpacity>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>请输入备注信息（选填）</Text>
            <TextInput
              style={styles.textArea}
              placeholder=""
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>确定收款</Text>
        </TouchableOpacity>
      </View>

      {/* 日期选择器 */}
      <DateWheelPicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={handleDateSelect}
        initialDate={paymentDate}
        title="选择收款日期"
      />
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
    backgroundColor: '#5b7ce6',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
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
  amountCard: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  formRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#4a90e2',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4a90e2',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  formValue: {
    fontSize: 14,
    color: '#333',
  },
  formInput: {
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 12,
  },
  methodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: 'white',
  },
  methodButtonActive: {
    borderColor: '#4a90e2',
    backgroundColor: '#e3f2fd',
  },
  methodButtonText: {
    fontSize: 13,
    color: '#666',
  },
  methodButtonTextActive: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
})

