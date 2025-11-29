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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import accountHistoryService, { AccountHistory } from '../services/accountHistoryService'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [accountHistory, setAccountHistory] = useState<AccountHistory[]>([])
  const [showHistory, setShowHistory] = useState(true)

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
      Alert.alert('提示', '请输入邮箱和密码')
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('提示', '请输入有效的邮箱地址')
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
        Alert.alert('登录成功', '欢迎回来！')
      } else {
        Alert.alert('登录失败', result.error || '登录失败，请检查用户名和密码')
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '登录时发生错误，请稍后重试')
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
    Alert.alert(
      '确认删除',
      `确定要删除账号 ${email} 的历史记录吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await accountHistoryService.removeAccount(email)
            await loadAccountHistory()
          },
        },
      ]
    )
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
            <Text style={styles.logo}>🏨</Text>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6366f1',
  },
  loginButton: {
    height: 50,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 4,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // 历史账号样式
  historyContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  hideHistoryText: {
    fontSize: 14,
    color: '#6366f1',
  },
  historyItem: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
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
    marginBottom: 8,
  },
  historyAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  historyEmail: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  historyTime: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  historyHint: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  showHistoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  showHistoryText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
})

