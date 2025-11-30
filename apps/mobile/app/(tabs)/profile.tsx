import React, { useState, useEffect } from 'react'
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
  ActivityIndicator,
} from 'react-native'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { restoreState } from '../store/calendarSlice'
import { persistedStorage, authStorage } from '../services/storage'
import { useAuth } from '../contexts/AuthContext'
import { dataService } from '../services/dataService'
import { api } from '../services/api'
import { FontSizes, Spacings, ComponentSizes } from '../utils/responsive'

interface UserInfo {
  name: string
  email: string
  phone: string
  avatar?: string
  role: string
  property: string
  hotelName: string
  position: string
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
  const dispatch = useAppDispatch()
  const calendarState = useAppSelector(state => state.calendar)
  const { logout, user, refreshUser } = useAuth()
  
  // 从Redux获取数据统计
  const rooms = useAppSelector(state => state.calendar.rooms)
  const reservations = useAppSelector(state => state.calendar.reservations)
  const roomStatuses = useAppSelector(state => state.calendar.roomStatuses)
  
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: user?.name || '张经理',
    email: user?.email || 'manager@roomease.com',
    phone: '13800138888',
    role: user?.role || '酒店经理',
    property: '阳光民宿',
    hotelName: '',
    position: '',
  })

  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    autoBackup: false,
    darkMode: false,
  })

  const [dataStats, setDataStats] = useState({
    rooms: 0,
    reservations: 0,
    roomStatuses: 0,
    storageSize: '0 KB',
  })

  const [isLoading, setIsLoading] = useState(false)

  // 监听用户变化，更新用户信息
  useEffect(() => {
    if (user) {
      setUserInfo(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        role: user.role,
      }))
    }
  }, [user])

  // 加载数据统计
  useEffect(() => {
    loadDataStatistics()
  }, [calendarState])

  // 加载用户信息
  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      // 从 AuthContext 获取最新用户信息
      await refreshUser()
      
      // 尝试从本地存储加载其他信息
      const savedUserInfo = await authStorage.getUserInfo()
      if (savedUserInfo) {
        setUserInfo(prev => ({
          ...prev,
          ...savedUserInfo
        }))
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  const saveUserInfo = async (info: UserInfo) => {
    await authStorage.saveUserInfo(info)
  }

  const loadDataStatistics = async () => {
    setDataStats({
      rooms: rooms.length || 0,
      reservations: reservations.length || 0,
      roomStatuses: roomStatuses.length || 0,
      storageSize: '0 KB',
    })
  }

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

  const saveProfileEdit = async () => {
    if (!editValue.trim()) {
      Alert.alert('错误', '请输入有效的内容')
      return
    }

    setIsLoading(true)

    try {
      // 准备要更新的数据
      const updateData: any = {}
      
      // 根据字段类型映射到后端字段
      if (editField === 'name') {
        updateData.name = editValue
      } else if (editField === 'phone') {
        updateData.phone = editValue
      } else if (editField === 'hotelName') {
        updateData.hotelName = editValue
      } else if (editField === 'position') {
        updateData.position = editValue
      } else if (editField === 'email') {
        // 邮箱通常不允许修改，或需要特殊验证
        Alert.alert('提示', '邮箱地址无法修改')
        setIsLoading(false)
        return
      }

      // 调用API更新用户信息
      await api.auth.updateProfile(updateData)

      // 更新本地状态
      const newUserInfo = {
        ...userInfo,
        [editField]: editValue
      }
      setUserInfo(newUserInfo)
      await saveUserInfo(newUserInfo)

      // 刷新用户信息（从服务器获取最新数据）
      await refreshUser()

      setEditModalVisible(false)
      Alert.alert('成功', '个人信息已更新并同步到服务器')
    } catch (error: any) {
      console.error('更新个人信息失败:', error)
      Alert.alert('失败', error.message || '更新失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = () => {
    setPasswordModalVisible(true)
  }

  const savePasswordChange = async () => {
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

    // 新密码不能与旧密码相同
    if (passwordData.oldPassword === passwordData.newPassword) {
      Alert.alert('错误', '新密码不能与当前密码相同')
      return
    }

    setIsLoading(true)

    try {
      // 调用API修改密码
      const response = await api.auth.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword
      )

      setPasswordModalVisible(false)
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      
      Alert.alert('成功', '密码修改成功，请使用新密码登录', [
        {
          text: '确定',
          onPress: async () => {
            // 修改密码成功后，自动登出，让用户使用新密码重新登录
            await logout()
          }
        }
      ])
    } catch (error: any) {
      console.error('修改密码失败:', error)
      
      // 从error.message获取中文错误信息
      const errorMessage = error.message || error.response?.data?.message || '修改密码失败，请重试'
      
      Alert.alert('失败', errorMessage)
    } finally {
      setIsLoading(false)
    }
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
          onPress: async () => {
            try {
              await logout()
              // logout 函数会自动跳转到登录页
            } catch (error: any) {
              Alert.alert('错误', error.message || '退出登录失败')
            }
          }
        }
      ]
    )
  }

  // 已移除：数据导出功能（所有数据现在都在云端）

  // 已移除：数据导入功能（所有数据现在都在云端）
  
  // 已移除：数据备份功能（所有数据现在都在云端自动备份）
  
  const handleClearCache = async () => {
    Alert.alert(
      '清除缓存',
      '确定要清除所有本地缓存吗？\n\n清除后将从服务器重新获取数据。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true)
            try {
              await dataService.cache.clearAll()
              Alert.alert('成功', '缓存已清除')
            } catch (error: any) {
              Alert.alert('失败', error.message || '清除缓存失败')
            } finally {
              setIsLoading(false)
            }
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
      {/* 加载遮罩 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>处理中...</Text>
          </View>
        </View>
      )}
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 用户信息卡片 */}
        <View style={styles.userCard}>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>{userInfo.name[0]}</Text>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userRole}>
              {userInfo.position || userInfo.role}
              {(userInfo.hotelName || userInfo.property) && ` • ${userInfo.hotelName || userInfo.property}`}
            </Text>
            <Text style={styles.userEmail}>{userInfo.email}</Text>
          </View>
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
              label="民宿/酒店名称"
              value={userInfo.hotelName || '未设置'}
              type="input"
              onPress={() => handleEditProfile('hotelName')}
            />
            <SettingItem
              label="职位"
              value={userInfo.position || '未设置'}
              type="input"
              onPress={() => handleEditProfile('position')}
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
          
          {/* 数据统计卡片 */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>数据统计</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dataStats.rooms}</Text>
                <Text style={styles.statLabel}>房间</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dataStats.reservations}</Text>
                <Text style={styles.statLabel}>预订</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dataStats.roomStatuses}</Text>
                <Text style={styles.statLabel}>房态</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dataStats.storageSize}</Text>
                <Text style={styles.statLabel}>存储</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingsList}>
            <SettingItem
              label="清除缓存"
              type="action"
              onPress={handleClearCache}
            />
          </View>
          
          <Text style={styles.dataManagementTip}>
            💡 提示：所有数据都存储在云端服务器。本地缓存仅用于提高加载速度，清除缓存后会从服务器重新获取数据。
          </Text>
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
              编辑{
                editField === 'name' ? '姓名' : 
                editField === 'email' ? '邮箱' : 
                editField === 'phone' ? '手机号' :
                editField === 'hotelName' ? '民宿/酒店名称' :
                editField === 'position' ? '职位' : ''
              }
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`请输入${
                editField === 'name' ? '姓名' : 
                editField === 'email' ? '邮箱' : 
                editField === 'phone' ? '手机号' :
                editField === 'hotelName' ? '民宿/酒店名称' :
                editField === 'position' ? '职位' : ''
              }`}
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
    margin: Spacings.lg,
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.xl,
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
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacings.lg,
  },
  userName: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacings.xs,
  },
  userRole: {
    fontSize: FontSizes.normal,
    color: '#64748b',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: FontSizes.small,
    color: '#94a3b8',
  },
  editButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#6366f1',
    fontSize: FontSizes.normal,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.xxl,
  },
  sectionTitle: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacings.md,
  },
  settingsList: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacings.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLabel: {
    fontSize: FontSizes.medium,
    color: '#1e293b',
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: FontSizes.normal,
    color: '#64748b',
    marginRight: Spacings.sm,
  },
  settingArrow: {
    fontSize: FontSizes.xlarge,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.xxxl,
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: FontSizes.medium,
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
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: ComponentSizes.borderRadius,
    padding: Spacings.md,
    fontSize: FontSizes.medium,
    marginBottom: Spacings.lg,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    marginBottom: Spacings.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsTitle: {
    fontSize: FontSizes.normal,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: Spacings.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: Spacings.xs,
  },
  statLabel: {
    fontSize: FontSizes.small,
    color: '#94a3b8',
  },
  dataManagementTip: {
    fontSize: FontSizes.small,
    color: '#64748b',
    marginTop: Spacings.md,
    lineHeight: 18,
    paddingHorizontal: Spacings.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.xxl,
    alignItems: 'center',
    minWidth: 120,
  },
  loadingText: {
    marginTop: Spacings.md,
    fontSize: FontSizes.normal,
    color: '#64748b',
  },
}) 