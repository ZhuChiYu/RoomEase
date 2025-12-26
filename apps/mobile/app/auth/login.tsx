import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import accountHistoryService, { AccountHistory } from '../services/accountHistoryService'
import { FontSizes, Spacings, ComponentSizes } from '../utils/responsive'
import { CustomAlert } from '../utils/CustomAlert'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [accountHistory, setAccountHistory] = useState<AccountHistory[]>([])
  const [showHistory, setShowHistory] = useState(true)
  
  // 自定义Alert状态
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [] as any[],
  })

  // 加载历史账号
  useEffect(() => {
    loadAccountHistory()
  }, [])

  const loadAccountHistory = async () => {
    const history = await accountHistoryService.getAccountHistory()
    setAccountHistory(history)
    
    // 如果有历史账号且邮箱为空，自动填充最近的账号
    if (history.length > 0 && !email) {
      setEmail(history[0].email)
    }
  }

  const handleLogin = async () => {
    // 验证输入
    if (!email.trim() || !password.trim()) {
      setAlertConfig({
        visible: true,
        title: '提示',
        message: '请输入邮箱和密码',
        buttons: [{ text: '确定', style: 'default' }],
      })
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setAlertConfig({
        visible: true,
        title: '提示',
        message: '请输入有效的邮箱地址',
        buttons: [{ text: '确定', style: 'default' }],
      })
      return
    }

    setIsLoading(true)

    try {
      // 使用 AuthContext 的 login 方法
      const result = await login(email.trim().toLowerCase(), password)

      if (result.success) {
        // 登录成功，保存到历史记录
        await accountHistoryService.addOrUpdateAccount(
          email.trim().toLowerCase(),
          result.data?.user?.name
        )
        
        // AuthContext 会自动跳转，这里只显示提示
        setAlertConfig({
          visible: true,
          title: '登录成功',
          message: '欢迎回来！',
          buttons: [{ text: '确定', style: 'default' }],
        })
      } else {
        setAlertConfig({
          visible: true,
          title: '登录失败',
          message: result.error || '登录失败，请检查用户名和密码',
          buttons: [{ text: '确定', style: 'default' }],
        })
      }
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: '错误',
        message: error.message || '登录时发生错误，请稍后重试',
        buttons: [{ text: '确定', style: 'default' }],
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 选择历史账号
  const selectAccount = (account: AccountHistory) => {
    setEmail(account.email)
    setShowHistory(false)
    // 自动聚焦到密码输入框
  }

  // 删除历史账号
  const deleteAccount = async (email: string) => {
    setAlertConfig({
      visible: true,
      title: '确认删除',
      message: `确定要删除账号 ${email} 的历史记录吗？`,
      buttons: [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await accountHistoryService.removeAccount(email)
            await loadAccountHistory()
          },
        },
      ],
    })
  }

  // 格式化时间显示
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const goToRegister = () => {
    router.push('/auth/register')
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo 和标题 */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/splash.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>客满云</Text>
            <Text style={styles.subtitle}>酒店民宿管理系统</Text>
          </View>

          {/* 历史账号列表 */}
          {accountHistory.length > 0 && showHistory && (
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>选择账号</Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Text style={styles.hideHistoryText}>使用其他账号</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={accountHistory}
                keyExtractor={(item) => item.email}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.historyItem,
                      email === item.email && styles.historyItemActive
                    ]}
                    onPress={() => selectAccount(item)}
                    onLongPress={() => deleteAccount(item.email)}
                  >
                    <View style={styles.historyAvatar}>
                      <Text style={styles.historyAvatarText}>
                        {item.name?.[0]?.toUpperCase() || item.email[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.historyName} numberOfLines={1}>
                      {item.name || item.email.split('@')[0]}
                    </Text>
                    <Text style={styles.historyEmail} numberOfLines={1}>
                      {item.email}
                    </Text>
                    <Text style={styles.historyTime}>
                      {formatTime(item.lastLoginTime)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              
              <Text style={styles.historyHint}>
                长按账号可删除历史记录
              </Text>
            </View>
          )}

          {/* 如果隐藏了历史记录，显示切换回来的按钮 */}
          {accountHistory.length > 0 && !showHistory && (
            <TouchableOpacity
              style={styles.showHistoryButton}
              onPress={() => setShowHistory(true)}
            >
              <Text style={styles.showHistoryText}>← 选择历史账号</Text>
            </TouchableOpacity>
          )}

          {/* 登录表单 */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>邮箱</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入邮箱"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>密码</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* 忘记密码 */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>忘记密码？</Text>
            </TouchableOpacity>

            {/* 登录按钮 */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>登录</Text>
              )}
            </TouchableOpacity>

            {/* 注册提示 */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>还没有账号？</Text>
              <TouchableOpacity onPress={goToRegister} disabled={isLoading}>
                <Text style={styles.registerLink}>立即注册</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 底部提示 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              登录即表示同意用户协议和隐私政策
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* 自定义弹窗 */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacings.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacings.xxxl,
    marginBottom: Spacings.xxxl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacings.lg,
  },
  title: {
    fontSize: FontSizes.huge,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: Spacings.sm,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: '#6b7280',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: Spacings.lg,
  },
  label: {
    fontSize: FontSizes.normal,
    fontWeight: '600',
    color: '#374151',
    marginBottom: Spacings.sm,
  },
  input: {
    minHeight: ComponentSizes.inputHeight,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: ComponentSizes.borderRadius,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    fontSize: FontSizes.medium,
    backgroundColor: '#fff',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacings.xl,
  },
  forgotPasswordText: {
    fontSize: FontSizes.normal,
    color: '#6366f1',
  },
  loginButton: {
    minHeight: ComponentSizes.buttonHeight,
    backgroundColor: '#6366f1',
    borderRadius: ComponentSizes.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.lg,
    paddingVertical: Spacings.md,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  registerText: {
    fontSize: FontSizes.normal,
    color: '#6b7280',
    marginRight: 4,
  },
  registerLink: {
    fontSize: FontSizes.normal,
    fontWeight: '600',
    color: '#6366f1',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacings.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSizes.small,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // 历史账号样式
  historyContainer: {
    marginBottom: Spacings.xl,
    backgroundColor: '#fff',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.md,
  },
  historyTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#1f2937',
  },
  hideHistoryText: {
    fontSize: FontSizes.normal,
    color: '#6366f1',
  },
  historyItem: {
    width: 100,
    alignItems: 'center',
    padding: Spacings.md,
    marginRight: Spacings.md,
    borderRadius: ComponentSizes.borderRadius,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  historyItemActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  historyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.sm,
  },
  historyAvatarText: {
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyName: {
    fontSize: FontSizes.normal,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
    numberOfLines: 1,
  },
  historyEmail: {
    fontSize: FontSizes.tiny,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
    numberOfLines: 1,
  },
  historyTime: {
    fontSize: FontSizes.tiny,
    color: '#9ca3af',
    textAlign: 'center',
  },
  historyHint: {
    fontSize: FontSizes.tiny,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: Spacings.sm,
  },
  showHistoryButton: {
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    marginBottom: Spacings.lg,
    alignSelf: 'flex-start',
  },
  showHistoryText: {
    fontSize: FontSizes.normal,
    color: '#6366f1',
    fontWeight: '500',
  },
})

