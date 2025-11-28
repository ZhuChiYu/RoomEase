/**
 * 开发者设置页面
 * 包含数据源切换、数据导入导出、调试工具等
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getDeveloperModeConfig, setDeveloperMode } from '../services/dataService'
import {
  exportAllData,
  importDataFromFile,
  restoreBackupData,
  clearAllData,
  getDataStats,
} from '../services/dataBackupService'
import { initializeLocalData } from '../services/localDataService'
import { api, updateApiBaseUrl, getCurrentApiUrl } from '../services/api'
import { API_CONFIG, API_SERVERS } from '../config/environment'
import {
  getApiServerUrl,
  setApiServerUrl,
  getAvailableServers,
} from '../services/apiConfigService'
import type { BackupData } from '../services/dataBackupService'

export default function DeveloperScreen() {
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dataStats, setDataStats] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [currentServerUrl, setCurrentServerUrl] = useState<string>(API_CONFIG.BASE_URL)
  const [serverStatus, setServerStatus] = useState<{
    connected: boolean
    testing: boolean
    lastTest?: string
    error?: string
    duration?: number
  }>({
    connected: false,
    testing: false,
  })

  // 加载配置
  useEffect(() => {
    loadConfig()
    loadDataStats()
    // 如果是服务器模式，自动测试连接
    if (!useLocalStorage) {
      testServerConnection()
    }
  }, [])

  // 监听数据源切换，自动测试服务器连接
  useEffect(() => {
    if (!useLocalStorage) {
      testServerConnection()
    }
  }, [useLocalStorage])

  const loadConfig = async () => {
    try {
      const config = await getDeveloperModeConfig()
      setUseLocalStorage(config.useLocalStorage)
      setLastUpdate(config.lastUpdated)
      
      // 加载当前服务器地址
      const serverUrl = await getApiServerUrl()
      setCurrentServerUrl(serverUrl)
      console.log('当前API服务器:', serverUrl)
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }

  const loadDataStats = async () => {
    try {
      const stats = await getDataStats()
      setDataStats(stats)
    } catch (error) {
      console.error('加载数据统计失败:', error)
    }
  }

  // 输入自定义服务器地址
  const handleCustomServer = () => {
    Alert.prompt(
      '自定义服务器地址',
      '输入完整的服务器地址（包含 http:// 或 https://）\n\n例如：\n• https://your-url.ngrok-free.app\n• http://192.168.1.100:4000',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: async (url?: string) => {
            if (!url || url.trim() === '') {
              Alert.alert('错误', '请输入有效的服务器地址')
              return
            }

            const trimmedUrl = url.trim()

            // 验证 URL 格式
            if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
              Alert.alert('错误', '服务器地址必须以 http:// 或 https:// 开头')
              return
            }

            try {
              setIsLoading(true)

              // 保存新的服务器地址
              await setApiServerUrl(trimmedUrl)

              // 更新API客户端
              await updateApiBaseUrl(trimmedUrl)

              // 更新本地状态
              setCurrentServerUrl(trimmedUrl)

              console.log('✅ 自定义服务器地址已设置:', trimmedUrl)

              // 自动测试新服务器连接
              await testServerConnection()

              Alert.alert(
                '服务器已更新',
                `新地址: ${trimmedUrl}\n\n${trimmedUrl.startsWith('https://') ? '✅ 使用 HTTPS 加密连接' : '⚠️ 使用 HTTP 明文连接'}`,
                [{ text: '确定' }]
              )
            } catch (error: any) {
              console.error('设置自定义服务器失败:', error)
              Alert.alert('设置失败', error.message)
            } finally {
              setIsLoading(false)
            }
          },
        },
      ],
      'plain-text',
      currentServerUrl
    )
  }

  // 切换服务器地址
  const handleChangeServer = () => {
    const servers = getAvailableServers()
    
    Alert.alert(
      '选择API服务器',
      '请选择要连接的服务器',
      [
        ...servers.map(server => ({
          text: `${server.name}${server.recommended ? ' ⭐' : ''}`,
          onPress: async () => {
            try {
              setIsLoading(true)
              
              // 保存新的服务器地址
              await setApiServerUrl(server.url)
              
              // 更新API客户端
              await updateApiBaseUrl(server.url)
              
              // 更新本地状态
              setCurrentServerUrl(server.url)
              
              console.log('✅ 服务器地址已切换:', server.url)
              
              // 自动测试新服务器连接
              await testServerConnection()
              
              Alert.alert(
                '服务器已切换',
                `${server.name}\n${server.url}\n\n${server.description}`,
                [{ text: '确定' }]
              )
            } catch (error: any) {
              console.error('切换服务器失败:', error)
              Alert.alert('切换失败', error.message)
            } finally {
              setIsLoading(false)
            }
          },
        })),
        {
          text: '✏️ 自定义地址',
          onPress: handleCustomServer,
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ]
    )
  }

  // 测试服务器连接
  const testServerConnection = async () => {
    console.log('🔌 开始测试服务器连接...')
    const currentUrl = getCurrentApiUrl()
    console.log('服务器地址:', currentUrl)
    
    setServerStatus({
      connected: false,
      testing: true,
    })

    try {
      const result = await api.health.test()
      console.log('✅ 服务器连接测试完成:', result)
      
      if (result.health.success) {
        setServerStatus({
          connected: true,
          testing: false,
          lastTest: new Date().toISOString(),
          duration: result.health.duration,
        })
        console.log('✅ 服务器连接成功')
      } else {
        setServerStatus({
          connected: false,
          testing: false,
          lastTest: new Date().toISOString(),
          error: result.health.error || '未知错误',
        })
        console.error('❌ 服务器连接失败:', result.health.error)
      }
    } catch (error: any) {
      console.error('❌ 服务器连接测试异常:', error)
      setServerStatus({
        connected: false,
        testing: false,
        lastTest: new Date().toISOString(),
        error: error.message || '连接异常',
      })
    }
  }

  // 手动测试连接按钮
  const handleTestConnection = async () => {
    Alert.alert(
      '测试服务器连接',
      `将测试连接到: ${API_CONFIG.BASE_URL}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '开始测试',
          onPress: async () => {
            await testServerConnection()
            
            // 显示测试结果
            if (serverStatus.connected) {
              Alert.alert(
                '✅ 连接成功',
                `服务器响应正常\n响应时间: ${serverStatus.duration}ms\n服务器: ${API_CONFIG.BASE_URL}`,
                [{ text: '确定' }]
              )
            } else {
              Alert.alert(
                '❌ 连接失败',
                `无法连接到服务器\n错误: ${serverStatus.error}\n服务器: ${API_CONFIG.BASE_URL}\n\n请检查：\n1. 服务器是否正在运行\n2. 网络连接是否正常\n3. API地址是否正确`,
                [{ text: '确定' }]
              )
            }
          },
        },
      ]
    )
  }

  // 切换数据源
  const handleToggleDataSource = async (value: boolean) => {
    try {
      setUseLocalStorage(value)
      await setDeveloperMode(value)
      setLastUpdate(new Date().toISOString())

      Alert.alert(
        '数据源已切换',
        value ? '现在使用本地存储\n所有数据将保存在本地' : '现在使用服务器API\n所有数据将从服务器获取',
        [{ text: '确定' }]
      )
    } catch (error: any) {
      Alert.alert('切换失败', error.message)
      setUseLocalStorage(!value)
    }
  }

  // 导出数据
  const handleExportData = async () => {
    if (!useLocalStorage) {
      Alert.alert('提示', '请先切换到本地存储模式才能导出数据')
      return
    }

    setIsLoading(true)
    try {
      const result = await exportAllData()
      if (result.success) {
        Alert.alert('导出成功', result.message)
        await loadDataStats()
      } else {
        Alert.alert('导出失败', result.message)
      }
    } catch (error: any) {
      Alert.alert('导出失败', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 导入数据
  const handleImportData = async () => {
    if (!useLocalStorage) {
      Alert.alert('提示', '请先切换到本地存储模式才能导入数据')
      return
    }

    Alert.alert(
      '导入数据',
      '请选择导入模式：',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '替换（覆盖现有数据）',
          onPress: () => performImport('replace'),
          style: 'destructive',
        },
        {
          text: '合并（保留现有数据）',
          onPress: () => performImport('merge'),
        },
      ]
    )
  }

  const performImport = async (mode: 'replace' | 'merge') => {
    setIsLoading(true)
    try {
      // 选择文件
      const importResult = await importDataFromFile()
      if (!importResult.success || !importResult.data) {
        Alert.alert('导入失败', importResult.message)
        return
      }

      // 恢复数据
      const restoreResult = await restoreBackupData(importResult.data, mode)
      if (restoreResult.success) {
        Alert.alert('导入成功', restoreResult.message)
        await loadDataStats()
      } else {
        Alert.alert('导入失败', restoreResult.message)
      }
    } catch (error: any) {
      Alert.alert('导入失败', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 清空数据
  const handleClearData = () => {
    if (!useLocalStorage) {
      Alert.alert('提示', '请先切换到本地存储模式才能清空数据')
      return
    }

    Alert.alert(
      '⚠️ 危险操作',
      '确定要清空所有本地数据吗？\n此操作不可恢复！',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定清空',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true)
            try {
              const result = await clearAllData()
              if (result.success) {
                Alert.alert('清空成功', result.message)
                await loadDataStats()
              } else {
                Alert.alert('清空失败', result.message)
              }
            } catch (error: any) {
              Alert.alert('清空失败', error.message)
            } finally {
              setIsLoading(false)
            }
          },
        },
      ]
    )
  }

  // 初始化示例数据
  const handleInitializeData = async () => {
    if (!useLocalStorage) {
      Alert.alert('提示', '请先切换到本地存储模式才能初始化数据')
      return
    }

    Alert.alert(
      '初始化数据',
      '将重新初始化示例数据（会保留现有数据）',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '初始化',
          onPress: async () => {
            setIsLoading(true)
            try {
              await initializeLocalData()
              Alert.alert('初始化成功', '示例数据已添加')
              await loadDataStats()
            } catch (error: any) {
              Alert.alert('初始化失败', error.message)
            } finally {
              setIsLoading(false)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>🛠️ 开发者设置</Text>
          <Text style={styles.subtitle}>数据源控制与调试工具</Text>
        </View>

        {/* 数据源切换 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>数据源配置</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>
                  {useLocalStorage ? '🏠 本地存储模式' : '🌐 服务器API模式'}
                </Text>
                <Text style={styles.settingDescription}>
                  {useLocalStorage
                    ? '数据保存在本地设备，离线可用'
                    : '数据从服务器获取，需要网络连接'}
                </Text>
                {lastUpdate && (
                  <Text style={styles.updateTime}>
                    最后更新: {new Date(lastUpdate).toLocaleString('zh-CN')}
                  </Text>
                )}
              </View>
              <Switch
                value={useLocalStorage}
                onValueChange={handleToggleDataSource}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor={useLocalStorage ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* 服务器连接状态 */}
        {!useLocalStorage && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>服务器配置</Text>
            </View>

            <View style={styles.card}>
              {/* 服务器地址选择 */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleChangeServer}
                disabled={isLoading}
              >
                <Text style={styles.actionIcon}>🌐</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>切换服务器</Text>
                  <Text style={styles.actionDescription} numberOfLines={1}>
                    当前: {currentServerUrl}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* 自定义服务器地址 */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCustomServer}
                disabled={isLoading}
              >
                <Text style={styles.actionIcon}>✏️</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>自定义服务器地址</Text>
                  <Text style={styles.actionDescription}>
                    输入 ngrok HTTPS URL 或其他地址
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* 连接状态指示 */}
              <View style={styles.connectionStatus}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>服务器地址:</Text>
                  <Text style={styles.statusValue} numberOfLines={1}>{currentServerUrl}</Text>
                </View>
                
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>连接状态:</Text>
                  <View style={styles.statusBadge}>
                    {serverStatus.testing ? (
                      <>
                        <ActivityIndicator size="small" color="#f59e0b" />
                        <Text style={[styles.statusText, styles.testingText]}>测试中...</Text>
                      </>
                    ) : serverStatus.connected ? (
                      <>
                        <View style={[styles.statusDot, styles.connectedDot]} />
                        <Text style={[styles.statusText, styles.connectedText]}>已连接</Text>
                      </>
                    ) : (
                      <>
                        <View style={[styles.statusDot, styles.disconnectedDot]} />
                        <Text style={[styles.statusText, styles.disconnectedText]}>未连接</Text>
                      </>
                    )}
                  </View>
                </View>

                {serverStatus.duration && (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>响应时间:</Text>
                    <Text style={styles.statusValue}>{serverStatus.duration}ms</Text>
                  </View>
                )}

                {serverStatus.lastTest && (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>最后测试:</Text>
                    <Text style={styles.statusValue}>
                      {new Date(serverStatus.lastTest).toLocaleTimeString('zh-CN')}
                    </Text>
                  </View>
                )}

                {serverStatus.error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>错误: {serverStatus.error}</Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* 测试按钮 */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleTestConnection}
                disabled={serverStatus.testing}
              >
                <Text style={styles.actionIcon}>🔌</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>测试服务器连接</Text>
                  <Text style={styles.actionDescription}>
                    验证app是否能连接到API服务器
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 连接提示 */}
            {!serverStatus.connected && !serverStatus.testing && (
              <View style={[styles.infoBox, styles.warningBox]}>
                <Text style={styles.infoIcon}>⚠️</Text>
                <Text style={[styles.infoText, styles.warningText]}>
                  无法连接到服务器。请检查：{'\n'}
                  1. 服务器是否正在运行{'\n'}
                  2. 网络连接是否正常{'\n'}
                  3. 尝试切换到其他服务器地址
                </Text>
              </View>
            )}

            {serverStatus.connected && (
              <View style={[styles.infoBox, styles.successBox]}>
                <Text style={styles.infoIcon}>✅</Text>
                <Text style={[styles.infoText, styles.successText]}>
                  服务器连接正常！所有API请求将发送到: {currentServerUrl}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 数据统计 */}
        {useLocalStorage && dataStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>本地数据统计</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>房间总数</Text>
                <Text style={styles.statValue}>{dataStats.totalRooms}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>预订总数</Text>
                <Text style={styles.statValue}>{dataStats.totalReservations}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>房态记录</Text>
                <Text style={styles.statValue}>{dataStats.totalRoomStatuses}</Text>
              </View>

              {dataStats.reservationsByStatus && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.subStatContainer}>
                    <Text style={styles.subStatTitle}>预订状态分布:</Text>
                    <View style={styles.subStatRow}>
                      <Text style={styles.subStatLabel}>待确认: {dataStats.reservationsByStatus.pending}</Text>
                      <Text style={styles.subStatLabel}>已确认: {dataStats.reservationsByStatus.confirmed}</Text>
                    </View>
                    <View style={styles.subStatRow}>
                      <Text style={styles.subStatLabel}>已入住: {dataStats.reservationsByStatus.checkedIn}</Text>
                      <Text style={styles.subStatLabel}>已退房: {dataStats.reservationsByStatus.checkedOut}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* 数据管理操作 */}
        {useLocalStorage && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>数据管理</Text>
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleExportData}
                disabled={isLoading}
              >
                <Text style={styles.actionIcon}>📤</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>导出所有数据</Text>
                  <Text style={styles.actionDescription}>
                    将所有数据导出为JSON文件
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleImportData}
                disabled={isLoading}
              >
                <Text style={styles.actionIcon}>📥</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>导入数据</Text>
                  <Text style={styles.actionDescription}>
                    从JSON文件恢复数据
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleInitializeData}
                disabled={isLoading}
              >
                <Text style={styles.actionIcon}>🔄</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>初始化示例数据</Text>
                  <Text style={styles.actionDescription}>
                    添加默认的示例房间数据
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleClearData}
                disabled={isLoading}
              >
                <Text style={styles.actionIcon}>🗑️</Text>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, styles.dangerText]}>
                    清空所有数据
                  </Text>
                  <Text style={styles.actionDescription}>
                    永久删除所有本地数据（不可恢复）
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 提示信息 */}
        {!useLocalStorage && (
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              当前使用服务器API模式。如需使用数据导入导出功能，请切换到本地存储模式。
            </Text>
          </View>
        )}

        {/* 加载指示器 */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>处理中...</Text>
          </View>
        )}

        {/* 系统信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>系统信息</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.systemInfo}>平台: {Platform.OS}</Text>
            <Text style={styles.systemInfo}>版本: {Platform.Version}</Text>
            <Text style={styles.systemInfo}>应用版本: 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  updateTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 15,
    color: '#374151',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
  },
  subStatContainer: {
    paddingTop: 12,
  },
  subStatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subStatLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  dangerButton: {
    opacity: 1,
  },
  dangerText: {
    color: '#dc2626',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  systemInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  connectionStatus: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedDot: {
    backgroundColor: '#10b981',
  },
  disconnectedDot: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectedText: {
    color: '#10b981',
  },
  disconnectedText: {
    color: '#ef4444',
  },
  testingText: {
    color: '#f59e0b',
    marginLeft: 4,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
  },
  warningText: {
    color: '#92400e',
  },
  successBox: {
    backgroundColor: '#d1fae5',
  },
  successText: {
    color: '#065f46',
  },
  chevron: {
    fontSize: 24,
    color: '#9ca3af',
    marginLeft: 8,
  },
})

