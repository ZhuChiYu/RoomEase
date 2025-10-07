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

export default function SendSMSScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  
  const { guestPhone, guestName } = params

  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedSignature, setSelectedSignature] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const templates = [
    '【温馨提示】您的房间已准备好，欢迎入住！',
    '【退房提醒】您的退房时间为今日12:00，如需延迟请联系前台。',
    '【支付提醒】您的订单还有￥{amount}元未支付，请尽快完成支付。',
  ]

  const signatures = ['阳光酒店', '民宿管理系统', 'RoomEase']

  const handleSend = () => {
    if (!messageContent.trim()) {
      Alert.alert('提示', '请输入短信内容')
      return
    }

    if (!agreedToTerms) {
      Alert.alert('提示', '请先阅读并同意《短信内容规则》和《短信协议》')
      return
    }

    Alert.alert(
      '发送成功',
      `短信已发送至 ${guestPhone}`,
      [
        {
          text: '确定',
          onPress: () => router.back()
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>发送短信</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>接收手机号：</Text>
        <View style={styles.phoneContainer}>
          <Text style={styles.phoneText}>{guestPhone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.selectRow}>
          <Text style={styles.label}>短信模板</Text>
          <Text style={styles.selectText}>请选择(非必选) ›</Text>
        </TouchableOpacity>
        
        {templates.map((template, index) => (
          <TouchableOpacity
            key={index}
            style={styles.templateItem}
            onPress={() => setMessageContent(template)}
          >
            <Text style={styles.templateText}>{template}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.selectRow}>
          <Text style={styles.label}>短信签名</Text>
          <Text style={styles.selectText}>请选择 ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>短信内容</Text>
        <TextInput
          style={styles.textArea}
          placeholder="请输入短信内容"
          value={messageContent}
          onChangeText={setMessageContent}
          multiline
          numberOfLines={6}
          maxLength={300}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{messageContent.length}/300</Text>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeIcon}>ⓘ</Text>
        <Text style={styles.noticeText}>
          66个字计费1条(含签名与标点)。超计1条将产生1条额外费用。
          {'\n'}模板内容中若包括"链接"、"空格"、"字母"、"符号"、"数字"，会对应拆解短信为"空格"；若可拆解，则以分别链接空格该条短信。
        </Text>
      </View>

      <View style={styles.agreement}>
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.agreementText}>
            已阅读并同意{' '}
            <Text 
              style={styles.link}
              onPress={() => router.push('/sms-rules')}
            >
              《短信内容规则》
            </Text>
            {' '}和{' '}
            <Text 
              style={styles.link}
              onPress={() => router.push('/sms-agreement')}
            >
              《短信协议》
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
        <Text style={styles.sendButtonText}>发送</Text>
      </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  phoneContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  phoneText: {
    fontSize: 16,
    color: '#f39c12',
    fontWeight: '600',
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectText: {
    fontSize: 14,
    color: '#999',
  },
  templateItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  templateText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 120,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  notice: {
    backgroundColor: '#fff3cd',
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
  },
  noticeIcon: {
    fontSize: 16,
    color: '#856404',
    marginRight: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  agreement: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  link: {
    color: '#4a90e2',
  },
  sendButton: {
    backgroundColor: '#4a90e2',
    margin: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
})

