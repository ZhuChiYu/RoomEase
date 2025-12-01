import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FontSizes, Spacings, ComponentSizes } from './utils/responsive'

interface HelpItem {
  title: string
  content: string
}

export default function HelpSupportScreen() {
  const router = useRouter()
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  const [feedbackData, setFeedbackData] = useState({
    type: '',
    content: '',
    contact: '',
  })

  const tutorials: HelpItem[] = [
    {
      title: '📱 快速入门',
      content: '了解如何快速开始使用满客云管理您的酒店或民宿。从创建房型、添加房间到接收第一个预订。',
    },
    {
      title: '🏨 房态管理',
      content: '在房态日历中查看和管理房间状态，长按房态格子可以批量选择操作，快速修改房间状态。',
    },
    {
      title: '📅 预订管理',
      content: '创建新预订、修改预订信息、取消预订、办理入住和退房等操作的详细说明。',
    },
    {
      title: '👤 客人管理',
      content: '录入客人信息、扫描身份证、管理客人资料等功能使用指南。',
    },
    {
      title: '💰 收款退款',
      content: '如何添加收款记录、处理退款、查看账单明细等财务相关操作。',
    },
    {
      title: '📊 数据报表',
      content: '查看经营数据、统计报表、收入明细等数据分析功能的使用方法。',
    },
  ]

  const faqs: HelpItem[] = [
    {
      title: '❓ 如何修改房间价格？',
      content: '在房态日历中点击对应日期的房间格子，在弹出菜单中选择"设置价格"，输入新的价格即可。支持按日期设置不同价格。',
    },
    {
      title: '❓ 如何批量操作房间状态？',
      content: '长按房间格子启动多选模式，然后滑动选择多个房间，选择完成后点击底部操作栏进行批量设置。',
    },
    {
      title: '❓ 忘记密码怎么办？',
      content: '在个人中心选择"修改密码"，输入当前密码和新密码即可重置。如果忘记当前密码，请联系客服协助重置。',
    },
    {
      title: '❓ 数据会丢失吗？',
      content: '不会。所有数据都实时保存到云端服务器，即使卸载应用或更换设备，重新登录后数据依然存在。',
    },
    {
      title: '❓ 如何添加房间？',
      content: '进入"个人中心" > "房型房间设置"，先创建房型，然后在房型中添加房间。每个房间都需要归属到某个房型下。',
    },
    {
      title: '❓ 如何导出数据？',
      content: '在统计页面或收入详情页面，点击右上角的导出按钮，可以导出Excel格式的数据报表。',
    },
    {
      title: '❓ 支持多人协作吗？',
      content: '支持。您可以邀请团队成员注册账号，共同管理同一个物业的数据。不同角色有不同的操作权限。',
    },
    {
      title: '❓ 如何联系客服？',
      content: '在本页面下方的"联系我们"区域，可以通过电话、邮件或在线客服联系我们的技术支持团队。',
    },
  ]

  const handleEmailSupport = () => {
    Linking.openURL('mailto:zhu.cy@outlook.com?subject=满客云技术支持').catch(err =>
      Alert.alert('错误', '无法打开邮件应用')
    )
  }

  const handleEmailConsult = () => {
    Linking.openURL('mailto:zhu.cy@outlook.com?subject=满客云使用咨询').catch(err =>
      Alert.alert('错误', '无法打开邮件应用')
    )
  }

  const handleFeedback = () => {
    setFeedbackModalVisible(true)
  }

  const saveFeedback = () => {
    if (!feedbackData.type || !feedbackData.content.trim()) {
      Alert.alert('提示', '请选择反馈类型并填写反馈内容')
      return
    }

    // 通过邮件发送反馈
    const emailBody = `反馈类型：${feedbackData.type}\n\n反馈内容：\n${feedbackData.content}\n\n联系方式：${feedbackData.contact || '未提供'}`
    const emailSubject = `满客云意见反馈 - ${feedbackData.type}`
    
    Linking.openURL(`mailto:zhu.cy@outlook.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`)
      .then(() => {
        setFeedbackModalVisible(false)
        setFeedbackData({ type: '', content: '', contact: '' })
        Alert.alert('提示', '即将打开邮件应用发送反馈')
      })
      .catch(err => {
        Alert.alert('错误', '无法打开邮件应用，请手动发送邮件到 zhu.cy@outlook.com')
      })
  }

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>帮助与支持</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 使用教程 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 使用教程</Text>
          {tutorials.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.helpItem}
              onPress={() => Alert.alert(item.title, item.content)}
            >
              <View style={styles.helpItemContent}>
                <Text style={styles.helpItemTitle}>{item.title}</Text>
                <Text style={styles.helpItemDescription} numberOfLines={2}>
                  {item.content}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 常见问题 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 常见问题</Text>
          {faqs.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.helpItem}
              onPress={() => Alert.alert(item.title, item.content)}
            >
              <View style={styles.helpItemContent}>
                <Text style={styles.helpItemTitle}>{item.title}</Text>
                <Text style={styles.helpItemDescription} numberOfLines={2}>
                  {item.content}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 联系我们</Text>
          
          <TouchableOpacity style={styles.contactCard} onPress={handleEmailConsult}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>💬</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>使用咨询</Text>
              <Text style={styles.contactDetail}>zhu.cy@outlook.com</Text>
              <Text style={styles.contactTime}>我们会及时回复您的咨询</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>📧</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>技术支持</Text>
              <Text style={styles.contactDetail}>zhu.cy@outlook.com</Text>
              <Text style={styles.contactTime}>我们会在24小时内回复</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleFeedback}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>✉️</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>意见反馈</Text>
              <Text style={styles.contactDetail}>向我们反馈问题或建议</Text>
              <Text style={styles.contactTime}>帮助我们做得更好</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 意见反馈弹窗 */}
      <Modal
        visible={feedbackModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>意见反馈</Text>
            
            <Text style={styles.fieldLabel}>反馈类型</Text>
            <View style={styles.typeSelector}>
              {['功能建议', '问题反馈', '使用咨询', '其他'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    feedbackData.type === type && styles.typeButtonActive
                  ]}
                  onPress={() => setFeedbackData(prev => ({ ...prev, type }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    feedbackData.type === type && styles.typeButtonTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.fieldLabel}>反馈内容</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={feedbackData.content}
              onChangeText={(text) => setFeedbackData(prev => ({ ...prev, content: text }))}
              placeholder="请详细描述您的意见或遇到的问题..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <TextInput
              style={styles.modalInput}
              value={feedbackData.contact}
              onChangeText={(text) => setFeedbackData(prev => ({ ...prev, contact: text }))}
              placeholder="联系方式（可选）"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setFeedbackModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveFeedback}
              >
                <Text style={styles.confirmButtonText}>提交反馈</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6366f1',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: Spacings.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    color: 'white',
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: Spacings.xl,
    paddingHorizontal: Spacings.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacings.md,
  },
  helpItem: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    marginBottom: Spacings.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  helpItemContent: {
    flex: 1,
  },
  helpItemTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: Spacings.xs,
  },
  helpItemDescription: {
    fontSize: FontSizes.normal,
    color: '#64748b',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 28,
    color: '#cbd5e1',
    fontWeight: '300',
    marginLeft: Spacings.md,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    marginBottom: Spacings.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacings.lg,
  },
  contactIconText: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: FontSizes.normal,
    color: '#6366f1',
    marginBottom: 4,
  },
  contactTime: {
    fontSize: FontSizes.small,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: Spacings.xl,
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.xxl,
    width: '90%',
  },
  modalTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacings.xl,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: FontSizes.normal,
    fontWeight: '600',
    color: '#374151',
    marginBottom: Spacings.sm,
    marginTop: Spacings.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacings.lg,
  },
  typeButton: {
    paddingHorizontal: Spacings.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  typeButtonText: {
    fontSize: FontSizes.small,
    color: '#64748b',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: ComponentSizes.borderRadius,
    padding: Spacings.md,
    fontSize: FontSizes.medium,
    marginBottom: Spacings.lg,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacings.xl,
  },
  modalButton: {
    flex: 1,
    padding: Spacings.md,
    borderRadius: ComponentSizes.borderRadius,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    marginRight: Spacings.sm,
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    marginLeft: Spacings.sm,
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
})

