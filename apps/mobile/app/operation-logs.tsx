import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAppSelector } from './store/hooks'

export default function OperationLogsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { orderId } = params

  // 从Redux获取操作日志
  const allLogs = useAppSelector(state => state.calendar.operationLogs)
  
  // 过滤当前订单的日志
  const logs = useMemo(() => {
    if (!orderId) return allLogs
    return allLogs.filter(log => log.orderId === orderId).reverse()
  }, [allLogs, orderId])

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>操作日志</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
      {logs.map((log, index) => (
        <View key={log.id} style={styles.logItem}>
          <View style={styles.logHeader}>
            <Text style={styles.logAction}>{log.action}</Text>
            <Text style={styles.logId}>{orderId}</Text>
          </View>
          
          <View style={styles.logContent}>
            <Text style={styles.logDetails}>{log.details}</Text>
          </View>

          <View style={styles.logFooter}>
            <Text style={styles.logMeta}>渠道：{log.operator}</Text>
            <Text style={styles.logTime}>{log.time}</Text>
          </View>

          {index < logs.length - 1 && <View style={styles.logDivider} />}
        </View>
      ))}
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
  logItem: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logId: {
    fontSize: 12,
    color: '#999',
  },
  logContent: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  logDetails: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logMeta: {
    fontSize: 12,
    color: '#999',
  },
  logTime: {
    fontSize: 12,
    color: '#999',
  },
  logDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginTop: 16,
  },
})

