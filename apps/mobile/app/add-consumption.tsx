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

export default function AddConsumptionScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  
  const { orderId } = params

  const [item, setItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  const handleComplete = () => {
    if (!item.trim()) {
      Alert.alert('提示', '请选择消费项目')
      return
    }

    if (!amount) {
      Alert.alert('提示', '请输入金额')
      return
    }

    Alert.alert(
      '添加成功',
      '消费记录已添加',
      [
        {
          text: '确定',
          onPress: () => router.back()
        }
      ]
    )
  }

  const consumptionItems = [
    '餐饮消费',
    '洗衣服务',
    '接送服务',
    '停车费',
    '迷你吧消费',
    '其他消费',
  ]

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>添加消费</Text>
        <TouchableOpacity onPress={handleComplete}>
          <Text style={styles.completeText}>完成</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formItem}>
          <Text style={styles.label}>项目</Text>
          <TouchableOpacity style={styles.input}>
            <Text style={styles.inputText}>{item || '请选择消费项目'}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>数量</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入数量"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>金额</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.prefix}>¥</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="请输入金额"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>消费日期</Text>
          <TouchableOpacity style={styles.input}>
            <Text style={styles.inputText}>{date}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>请输入备注信息（选填）</Text>
          <TextInput
            style={styles.textArea}
            placeholder=""
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
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
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  completeText: {
    fontSize: 16,
    color: '#5b7ce6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  formItem: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  prefix: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    marginTop: 8,
  },
})

