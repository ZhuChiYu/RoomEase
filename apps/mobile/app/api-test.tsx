/**
 * API测试页面
 * 用于测试后端API连接和功能
 */

import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { apiService } from './services/apiService'
import { FEATURE_FLAGS, API_CONFIG } from './config/environment'

export default function ApiTestScreen() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (title: string, success: boolean, data: any) => {
    setTestResults(prev => [...prev, { title, success, data, time: new Date().toLocaleTimeString() }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const testLogin = async () => {
    console.log('🧪 测试登录接口...')
    try {
      const result = await apiService.auth.login('admin@demo.com', '123456')
      addResult('登录测试', true, result)
      console.log('✅ 登录成功')
    } catch (error: any) {
      addResult('登录测试', false, error.message)
      console.error('❌ 登录失败:', error)
    }
  }

  const testRooms = async () => {
    console.log('🧪 测试获取房间列表...')
    try {
      const rooms = await apiService.rooms.getAll('demo-property')
      addResult('房间列表', true, { count: rooms.length, rooms: rooms.slice(0, 2) })
      console.log('✅ 获取房间成功:', rooms.length, '个')
    } catch (error: any) {
      addResult('房间列表', false, error.message)
      console.error('❌ 获取房间失败:', error)
    }
  }

  const testReservations = async () => {
    console.log('🧪 测试获取预订列表...')
    try {
      const reservations = await apiService.reservations.getAll('demo-property')
      addResult('预订列表', true, { count: reservations.length })
      console.log('✅ 获取预订成功:', reservations.length, '个')
    } catch (error: any) {
      addResult('预订列表', false, error.message)
      console.error('❌ 获取预订失败:', error)
    }
  }

  const testCalendar = async () => {
    console.log('🧪 测试获取日历数据...')
    try {
      const today = new Date().toISOString().split('T')[0]
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const data = await apiService.calendar.getData('demo-property', today, nextMonth)
      addResult('日历数据', true, { 
        rooms: data.rooms?.length || 0,
        reservations: data.reservations?.length || 0 
      })
      console.log('✅ 获取日历成功')
    } catch (error: any) {
      addResult('日历数据', false, error.message)
      console.error('❌ 获取日历失败:', error)
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    clearResults()
    console.log('🧪 开始运行所有测试...')
    
    await testLogin()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testRooms()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testReservations()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testCalendar()
    
    setLoading(false)
    console.log('✅ 所有测试完成')
    Alert.alert('测试完成', '所有API测试已完成，请查看结果')
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 API测试工具</Text>
        <View style={styles.configInfo}>
          <Text style={styles.configLabel}>配置状态</Text>
          <Text style={styles.configValue}>
            使用模式: {FEATURE_FLAGS.USE_BACKEND_API ? '✅ API服务' : '⚠️ 本地存储'}
          </Text>
          <Text style={styles.configValue}>
            API地址: {API_CONFIG.BASE_URL}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runAllTests}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '测试中...' : '🚀 运行所有测试'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={testLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔐 测试登录</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={testRooms}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🏠 测试房间列表</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={testReservations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📅 测试预订列表</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={testCalendar}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📆 测试日历数据</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>🗑️ 清除结果</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>测试结果 ({testResults.length})</Text>
        {testResults.map((result, index) => (
          <View 
            key={index} 
            style={[
              styles.resultItem,
              result.success ? styles.successItem : styles.errorItem
            ]}
          >
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {result.success ? '✅' : '❌'} {result.title}
              </Text>
              <Text style={styles.resultTime}>{result.time}</Text>
            </View>
            <Text style={styles.resultData}>
              {JSON.stringify(result.data, null, 2)}
            </Text>
          </View>
        ))}
        
        {testResults.length === 0 && (
          <Text style={styles.noResults}>暂无测试结果</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 提示: 请确保后端服务运行在 {API_CONFIG.BASE_URL}
        </Text>
        <Text style={styles.footerText}>
          💡 查看控制台日志可以看到详细的API请求信息
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  configInfo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  configLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  configValue: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 15,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    padding: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  successItem: {
    borderLeftColor: '#4CAF50',
  },
  errorItem: {
    borderLeftColor: '#f44336',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  resultData: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 4,
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
})

