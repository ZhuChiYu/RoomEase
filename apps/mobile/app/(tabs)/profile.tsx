import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  Modal,
  TextInput,
} from 'react-native'

interface UserInfo {
  name: string
  email: string
  phone: string
  avatar?: string
  role: string
  property: string
}

interface SettingsProps {
  label: string
  value?: string | boolean
  type: 'switch' | 'input' | 'action'
  onPress?: () => void
  onValueChange?: (value: any) => void
}

function SettingItem({ label, value, type, onPress, onValueChange }: SettingsProps) {
  if (type === 'switch') {
    return (
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Switch
          value={value as boolean}
          onValueChange={onValueChange}
          trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
          thumbColor={value ? '#ffffff' : '#f4f4f5'}
        />
      </View>
    )
  }

  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {type === 'input' && value && (
          <Text style={styles.settingValue}>{value}</Text>
        )}
        <Text style={styles.settingArrow}>›</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '张经理',
    email: 'manager@roomease.com',
    phone: '13800138888',
    role: '酒店经理',
    property: '阳光民宿',
  })

  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    autoBackup: false,
    darkMode: false,
  })

  const [editModalVisible, setEditModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [editField, setEditField] = useState<keyof UserInfo>('name')
  const [editValue, setEditValue] = useState('')
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleEditProfile = (field: keyof UserInfo) => {
    setEditField(field)
    setEditValue(userInfo[field] as string)
    setEditModalVisible(true)
  }

  const saveProfileEdit = () => {
    if (!editValue.trim()) {
      Alert.alert('错误', '请输入有效的内容')
      return
    }

    setUserInfo(prev => ({
      ...prev,
      [editField]: editValue
    }))
    setEditModalVisible(false)
    Alert.alert('成功', '个人信息已更新')
  }

  const handleChangePassword = () => {
    setPasswordModalVisible(true)
  }

  const savePasswordChange = () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('错误', '请填写所有密码字段')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('错误', '新密码与确认密码不匹配')
      return
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('错误', '新密码至少需要6位字符')
      return
    }

    setPasswordModalVisible(false)
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    Alert.alert('成功', '密码已更新')
  }

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出当前账号吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            Alert.alert('已退出', '您已成功退出登录')
          }
        }
      ]
    )
  }

  const handleDataExport = () => {
    Alert.alert(
      '数据导出',
      '选择要导出的数据类型',
      [
        { text: '预订数据', onPress: () => Alert.alert('导出中', '预订数据正在导出...') },
        { text: '财务数据', onPress: () => Alert.alert('导出中', '财务数据正在导出...') },
        { text: '客户数据', onPress: () => Alert.alert('导出中', '客户数据正在导出...') },
        { text: '取消', style: 'cancel' }
      ]
    )
  }

  const handleBackup = () => {
    Alert.alert(
      '数据备份',
      '确定要备份所有数据吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '开始备份',
          onPress: () => {
            Alert.alert('备份中', '数据备份正在进行中，请稍等...')
            setTimeout(() => {
              Alert.alert('备份完成', '所有数据已成功备份到云端')
            }, 2000)
          }
        }
      ]
    )
  }

  const handleAbout = () => {
    Alert.alert(
      '关于 RoomEase',
      'RoomEase 酒店民宿管理系统\n版本: 1.0.0\n\n一款专业的酒店民宿管理解决方案，帮助您轻松管理房态、预订、客户等各项业务。\n\n© 2024 RoomEase Team',
      [{ text: '确定' }]
    )
  }

  const handleHelp = () => {
    Alert.alert(
      '帮助与支持',
      '选择您需要的帮助类型',
      [
        { text: '使用教程', onPress: () => showTutorial() },
        { text: '常见问题', onPress: () => showFAQ() },
        { text: '联系客服', onPress: () => showContact() },
        { text: '意见反馈', onPress: () => showFeedback() },
        { text: '取消', style: 'cancel' }
      ]
    )
  }

  const showTutorial = () => {
    Alert.alert(
      '使用教程',
      '📱 快速入门指南\n\n1. 房态管理：在房态日历中查看和管理房间状态\n2. 预订管理：创建、修改和取消客房预订\n3. 客人入住：扫描身份证或手动录入客人信息\n4. 数据报表：查看经营数据和统计报表\n\n💡 提示：长按房态格子可以批量选择操作',
      [
        { text: '查看视频教程', onPress: () => Alert.alert('提示', '视频教程正在制作中...') },
        { text: '确定' }
      ]
    )
  }

  const showFAQ = () => {
    Alert.alert(
      '常见问题',
      '❓ 常见问题解答\n\n• 如何修改房间价格？\n  在房态日历中点击房间格子，选择"设置价格"\n\n• 如何批量操作房间状态？\n  长按房间格子启动多选模式，然后滑动选择\n\n• 忘记密码怎么办？\n  在个人中心选择"修改密码"重新设置\n\n• 数据如何备份？\n  在个人中心选择"数据备份"进行云端备份',
      [
        { text: '更多问题', onPress: () => Alert.alert('提示', '完整FAQ页面正在开发中...') },
        { text: '确定' }
      ]
    )
  }

  const showContact = () => {
    Alert.alert(
      '联系客服',
      '📞 客服热线：400-123-4567\n⏰ 服务时间：9:00-18:00（工作日）\n\n📧 邮箱支持：support@roomease.com\n\n💬 在线客服：微信扫码添加客服',
      [
        { text: '拨打电话', onPress: () => Alert.alert('提示', '即将拨打客服电话...') },
        { text: '发送邮件', onPress: () => Alert.alert('提示', '即将打开邮件应用...') },
        { text: '确定' }
      ]
    )
  }

  const showFeedback = () => {
    setFeedbackModalVisible(true)
  }

  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  const [feedbackData, setFeedbackData] = useState({
    type: '',
    content: '',
    contact: '',
  })

  const saveFeedback = () => {
    if (!feedbackData.type || !feedbackData.content.trim()) {
      Alert.alert('错误', '请选择反馈类型并填写反馈内容')
      return
    }

    setFeedbackModalVisible(false)
    setFeedbackData({ type: '', content: '', contact: '' })
    Alert.alert('反馈成功', '感谢您的反馈！我们会及时处理您的意见。')
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 用户信息卡片 */}
        <View style={styles.userCard}>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>{userInfo.name[0]}</Text>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userRole}>{userInfo.role} • {userInfo.property}</Text>
            <Text style={styles.userEmail}>{userInfo.email}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditProfile('name')}
          >
            <Text style={styles.editButtonText}>编辑</Text>
          </TouchableOpacity>
        </View>

        {/* 个人信息设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>个人信息</Text>
          <View style={styles.settingsList}>
            <SettingItem
              label="姓名"
              value={userInfo.name}
              type="input"
              onPress={() => handleEditProfile('name')}
            />
            <SettingItem
              label="邮箱"
              value={userInfo.email}
              type="input"
              onPress={() => handleEditProfile('email')}
            />
            <SettingItem
              label="手机号"
              value={userInfo.phone}
              type="input"
              onPress={() => handleEditProfile('phone')}
            />
            <SettingItem
              label="修改密码"
              type="action"
              onPress={handleChangePassword}
            />
          </View>
        </View>

        {/* 通知设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知设置</Text>
          <View style={styles.settingsList}>
            <SettingItem
              label="接收通知"
              value={settings.notifications}
              type="switch"
              onValueChange={(value) => handleSettingChange('notifications', value)}
            />
            <SettingItem
              label="声音提醒"
              value={settings.soundEnabled}
              type="switch"
              onValueChange={(value) => handleSettingChange('soundEnabled', value)}
            />
            <SettingItem
              label="自动备份"
              value={settings.autoBackup}
              type="switch"
              onValueChange={(value) => handleSettingChange('autoBackup', value)}
            />
            <SettingItem
              label="深色模式"
              value={settings.darkMode}
              type="switch"
              onValueChange={(value) => handleSettingChange('darkMode', value)}
            />
          </View>
        </View>

        {/* 数据管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <View style={styles.settingsList}>
            <SettingItem
              label="数据导出"
              type="action"
              onPress={handleDataExport}
            />
            <SettingItem
              label="数据备份"
              type="action"
              onPress={handleBackup}
            />
          </View>
        </View>

        {/* 其他设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>其他</Text>
          <View style={styles.settingsList}>
            <SettingItem
              label="帮助与支持"
              type="action"
              onPress={handleHelp}
            />
            <SettingItem
              label="关于我们"
              type="action"
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 编辑信息弹窗 */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              编辑{editField === 'name' ? '姓名' : editField === 'email' ? '邮箱' : '手机号'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`请输入${editField === 'name' ? '姓名' : editField === 'email' ? '邮箱' : '手机号'}`}
              keyboardType={editField === 'email' ? 'email-address' : editField === 'phone' ? 'phone-pad' : 'default'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveProfileEdit}
              >
                <Text style={styles.confirmButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 修改密码弹窗 */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>修改密码</Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.oldPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, oldPassword: text }))}
              placeholder="请输入当前密码"
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
              placeholder="请输入新密码"
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
              placeholder="请确认新密码"
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={savePasswordChange}
              >
                <Text style={styles.confirmButtonText}>确认修改</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  userCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#94a3b8',
  },
  editButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  settingsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  settingArrow: {
    fontSize: 20,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 12,
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
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
}) 