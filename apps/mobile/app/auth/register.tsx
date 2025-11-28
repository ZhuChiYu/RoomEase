import React, { useState } from 'react'
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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { authService } from '../services/authService'

export default function RegisterScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hotelName, setHotelName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    // 验证输入
    if (!name.trim()) {
      Alert.alert('提示', '请输入姓名')
      return
    }

    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱')
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('提示', '请输入有效的邮箱地址')
      return
    }

    if (!password) {
      Alert.alert('提示', '请输入密码')
      return
    }

    if (password.length < 6) {
      Alert.alert('提示', '密码长度至少为6位')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致')
      return
    }

    setIsLoading(true)

    try {
      const result = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        hotelName: hotelName.trim() || undefined,
      })

      if (result.success) {
        Alert.alert('注册成功', '欢迎使用客满云！', [
          {
            text: '确定',
            onPress: () => {
              // 跳转到主页面
              router.replace('/(tabs)')
            },
          },
        ])
      } else {
        Alert.alert('注册失败', result.error || '注册失败，请稍后重试')
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '注册时发生错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const goToLogin = () => {
    router.back()
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
            <Text style={styles.title}>创建账号</Text>
            <Text style={styles.subtitle}>开始使用客满云管理系统</Text>
          </View>

          {/* 注册表单 */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>姓名 *</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入姓名"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>邮箱 *</Text>
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
              <Text style={styles.label}>密码 *</Text>
              <TextInput
                style={styles.input}
                placeholder="至少6位"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>确认密码 *</Text>
              <TextInput
                style={styles.input}
                placeholder="再次输入密码"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>酒店名称（可选）</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入酒店或民宿名称"
                value={hotelName}
                onChangeText={setHotelName}
                editable={!isLoading}
              />
            </View>

            {/* 注册按钮 */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>注册</Text>
              )}
            </TouchableOpacity>

            {/* 登录提示 */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>已有账号？</Text>
              <TouchableOpacity onPress={goToLogin} disabled={isLoading}>
                <Text style={styles.loginLink}>立即登录</Text>
              </TouchableOpacity>
            </View>
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
    marginTop: 20,
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
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
  registerButton: {
    height: 50,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 4,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
})

