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
import type { BackupData } from '../services/dataBackupService'

export default function DeveloperScreen() {
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dataStats, setDataStats] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // 加载配置
  useEffect(() => {
    loadConfig()
    loadDataStats()
  }, [])

  const loadConfig = async () => {
    try {
      const config = await getDeveloperModeConfig()
      setUseLocalStorage(config.useLocalStorage)
      setLastUpdate(config.lastUpdated)
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
})

