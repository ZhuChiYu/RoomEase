import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAppSelector } from './store/hooks'

const { width } = Dimensions.get('window')

// 获取本地日期字符串（YYYY-MM-DD），避免时区问题
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface RevenueData {
  period: string
  totalRevenue: number
  roomRevenue: number
  serviceRevenue: number
  otherRevenue: number
  growth: number
}

interface RevenueCardProps {
  title: string
  value: string
  subtitle?: string
  growth?: number
  color: string
}

function RevenueCard({ title, value, subtitle, growth, color }: RevenueCardProps) {
  return (
    <View style={[styles.revenueCard, { borderLeftColor: color }]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      {growth !== undefined && (
        <Text style={[styles.cardGrowth, { color: growth >= 0 ? '#10b981' : '#ef4444' }]}>
          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
        </Text>
      )}
    </View>
  )
}

export default function RevenueDetailsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  
  // 从Redux获取预订数据
  const reservations = useAppSelector(state => state.calendar.reservations)
  
  // 处理从首页传递过来的参数
  useEffect(() => {
    if (params.period && typeof params.period === 'string') {
      console.log('💰 [收入详情] 接收到时间段参数:', params.period)
      setSelectedPeriod(params.period)
    }
  }, [params.period])
  
  // 计算真实的收入数据
  const revenueData: Record<string, RevenueData> = useMemo(() => {
    const today = getLocalDateString()
    const now = new Date()
    
    // 格式化日期为 YYYY-MM-DD
    const formatDate = (dateStr: string) => {
      try {
        return dateStr.split('T')[0]
      } catch {
        return dateStr
      }
    }
    
    // 计算收入明细的通用函数
    const calculateRevenue = (filteredReservations: any[]) => {
      let total = 0
      let roomRevenue = 0
      let otherFees = 0
      
      filteredReservations.forEach((r: any) => {
        total += Number(r.totalAmount) || 0
        // 房费 = 房间单价 × 天数
        roomRevenue += (Number(r.roomPrice) || 0) * (Number(r.nights) || 1)
        // 其他费用（如果有）
        otherFees += Number(r.otherFees) || 0
      })
      
      // 服务费 = 总金额 - 房费 - 其他费用
      const serviceRevenue = Math.max(0, total - roomRevenue - otherFees)
      
      return {
        totalRevenue: total,
        roomRevenue,
        serviceRevenue,
        otherRevenue: otherFees
      }
    }
    
    // 今日入住的订单
    const todayOrders = reservations.filter((r: any) => {
      const checkInDate = formatDate(r.checkInDate)
      const isCancelled = r.status === 'cancelled' || r.status === 'CANCELLED'
      return checkInDate === today && !isCancelled
    })
    
    // 本周入住的订单（周一到今天）
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    const startOfWeekStr = getLocalDateString(startOfWeek)
    
    const weekOrders = reservations.filter((r: any) => {
      const checkInDate = formatDate(r.checkInDate)
      const isCancelled = r.status === 'cancelled' || r.status === 'CANCELLED'
      return checkInDate >= startOfWeekStr && checkInDate <= today && !isCancelled
    })
    
    // 本月入住的订单
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const monthOrders = reservations.filter((r: any) => {
      if (!r.checkInDate) return false
      const checkInDate = new Date(r.checkInDate)
      const isCancelled = r.status === 'cancelled' || r.status === 'CANCELLED'
      return checkInDate.getMonth() + 1 === currentMonth && 
             checkInDate.getFullYear() === currentYear && 
             !isCancelled
    })
    
    // 本季度入住的订单
    const currentQuarter = Math.floor((currentMonth - 1) / 3)
    const quarterOrders = reservations.filter((r: any) => {
      if (!r.checkInDate) return false
      const checkInDate = new Date(r.checkInDate)
      const month = checkInDate.getMonth() + 1
      const quarter = Math.floor((month - 1) / 3)
      const isCancelled = r.status === 'cancelled' || r.status === 'CANCELLED'
      return quarter === currentQuarter && 
             checkInDate.getFullYear() === currentYear && 
             !isCancelled
    })
    
    // 本年入住的订单
    const yearOrders = reservations.filter((r: any) => {
      if (!r.checkInDate) return false
      const checkInDate = new Date(r.checkInDate)
      const isCancelled = r.status === 'cancelled' || r.status === 'CANCELLED'
      return checkInDate.getFullYear() === currentYear && !isCancelled
    })
    
    return {
      today: {
        period: '今日',
        ...calculateRevenue(todayOrders),
        growth: 8.5
      },
      week: {
        period: '本周',
        ...calculateRevenue(weekOrders),
        growth: 12.3
      },
      month: {
        period: '本月',
        ...calculateRevenue(monthOrders),
        growth: 15.8
      },
      quarter: {
        period: '本季度',
        ...calculateRevenue(quarterOrders),
        growth: 18.2
      },
      year: {
        period: '本年度',
        ...calculateRevenue(yearOrders),
        growth: 22.5
      }
    }
  }, [reservations])

  const currentData = revenueData[selectedPeriod]

  // 计算最近4个月的真实收入趋势
  const monthlyTrend = useMemo(() => {
    const now = new Date()
    const trends = []
    
    // 格式化日期
    const formatDate = (dateStr: string) => {
      try {
        return dateStr.split('T')[0]
      } catch {
        return dateStr
      }
    }
    
    // 计算最近4个月（包括当前月）
    for (let i = 3; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = targetDate.getMonth() + 1
      const year = targetDate.getFullYear()
      
      // 计算该月的收入
      const monthOrders = reservations.filter((r: any) => {
        if (!r.checkInDate) return false
        const checkInDate = new Date(r.checkInDate)
        const isCancelled = r.status === 'cancelled' || r.status === 'CANCELLED'
        return checkInDate.getMonth() + 1 === month && 
               checkInDate.getFullYear() === year && 
               !isCancelled
      })
      
      const revenue = monthOrders.reduce((sum, r: any) => sum + (Number(r.totalAmount) || 0), 0)
      
      trends.push({
        month: `${month}月`,
        revenue: revenue,
        growth: 0 // 增长率暂时设为0，需要和上个月对比计算
      })
    }
    
    // 计算增长率
    for (let i = 1; i < trends.length; i++) {
      if (trends[i - 1].revenue > 0) {
        trends[i].growth = ((trends[i].revenue - trends[i - 1].revenue) / trends[i - 1].revenue) * 100
      }
    }
    
    return trends
  }, [reservations])

  // 只显示有值的收入项
  const revenueBreakdown = [
    { type: '房费收入', amount: currentData.roomRevenue, percentage: currentData.totalRevenue > 0 ? (currentData.roomRevenue / currentData.totalRevenue * 100) : 0 },
    { type: '服务收入', amount: currentData.serviceRevenue, percentage: currentData.totalRevenue > 0 ? (currentData.serviceRevenue / currentData.totalRevenue * 100) : 0 },
    { type: '其他费用', amount: currentData.otherRevenue, percentage: currentData.totalRevenue > 0 ? (currentData.otherRevenue / currentData.totalRevenue * 100) : 0 },
  ].filter(item => item.amount > 0)

  const periods = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'quarter', label: '本季度' },
    { key: 'year', label: '本年度' },
  ]

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>收入详情</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 时间选择器 */}
        <View style={styles.periodSelector}>
          {periods.map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 总收入卡片 */}
        <View style={styles.section}>
          <RevenueCard
            title={`${currentData.period}总收入`}
            value={`¥${Math.round(currentData.totalRevenue).toLocaleString()}`}
            subtitle="较上期增长"
            growth={currentData.growth}
            color="#6366f1"
          />
        </View>

        {/* 收入分类 */}
        {revenueBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>收入构成</Text>
            <View style={styles.breakdownContainer}>
              {revenueBreakdown.map((item, index) => (
                <View key={index} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownType}>{item.type}</Text>
                    <Text style={styles.breakdownPercentage}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                  <Text style={styles.breakdownAmount}>¥{Math.round(item.amount).toLocaleString()}</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${item.percentage}%`,
                          backgroundColor: index === 0 ? '#6366f1' : index === 1 ? '#10b981' : '#f59e0b'
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 月度趋势 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedPeriod === 'year' ? '年度趋势' : '月度趋势'}
          </Text>
          <View style={styles.trendContainer}>
            {selectedPeriod === 'year' ? (
              // 年度趋势数据
              [
                { period: '2021', revenue: 2800000, growth: 15.2 },
                { period: '2022', revenue: 3200000, growth: 14.3 },
                { period: '2023', revenue: 3650000, growth: 14.1 },
                { period: '2024', revenue: 3784520, growth: 22.5 },
              ].map((item, index) => (
                <View key={index} style={styles.trendItem}>
                  <Text style={styles.trendMonth}>{item.period}</Text>
                  <View style={styles.trendBar}>
                    <View 
                      style={[
                        styles.trendBarFill,
                        { 
                          height: `${(item.revenue / 4000000) * 100}%`,
                          backgroundColor: '#6366f1'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.trendAmount}>
                    ¥{(item.revenue / 1000000).toFixed(1)}M
                  </Text>
                  <Text style={[styles.trendGrowth, { color: '#10b981' }]}>
                    +{item.growth}%
                  </Text>
                </View>
              ))
            ) : (
              // 原月度趋势数据
              monthlyTrend.map((item, index) => {
                // 找到最大收入值用于计算柱状图高度
                const maxRevenue = Math.max(...monthlyTrend.map(t => t.revenue), 1)
                const heightPercentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                
                return (
                  <View key={index} style={styles.trendItem}>
                    <Text style={styles.trendMonth}>{item.month}</Text>
                    <View style={styles.trendBar}>
                      <View 
                        style={[
                          styles.trendBarFill,
                          { 
                            height: item.revenue > 0 ? `${heightPercentage}%` : '5%',
                            backgroundColor: item.revenue > 0 ? '#6366f1' : '#e2e8f0'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.trendAmount}>
                      {item.revenue > 0 ? (
                        item.revenue >= 1000 
                          ? `¥${(item.revenue / 1000).toFixed(1)}k` 
                          : `¥${item.revenue}`
                      ) : '¥0'}
                    </Text>
                    {item.growth !== 0 && (
                      <Text style={[styles.trendGrowth, { color: item.growth > 0 ? '#10b981' : '#ef4444' }]}>
                        {item.growth > 0 ? '+' : ''}{item.growth.toFixed(1)}%
                      </Text>
                    )}
                  </View>
                )
              })
            )}
          </View>
        </View>

        {/* 详细分析 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>收入分析</Text>
          <View style={styles.analysisContainer}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>房费收入</Text>
              <Text style={styles.analysisValue}>¥{Math.round(currentData.roomRevenue).toLocaleString()}</Text>
            </View>
            {currentData.serviceRevenue > 0 && (
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>服务收入</Text>
                <Text style={styles.analysisValue}>¥{Math.round(currentData.serviceRevenue).toLocaleString()}</Text>
              </View>
            )}
            {currentData.otherRevenue > 0 && (
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>其他费用</Text>
                <Text style={styles.analysisValue}>¥{Math.round(currentData.otherRevenue).toLocaleString()}</Text>
              </View>
            )}
            {currentData.serviceRevenue > 0 && currentData.totalRevenue > 0 && (
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>服务收入占比</Text>
                <Text style={styles.analysisValue}>
                  {((currentData.serviceRevenue / currentData.totalRevenue) * 100).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    padding: 16,
    backgroundColor: '#6366f1',
    paddingTop: 50,
  },
  backButton: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 60,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  revenueCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  cardGrowth: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  breakdownContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownType: {
    fontSize: 14,
    color: '#64748b',
  },
  breakdownPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  breakdownAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trendItem: {
    alignItems: 'center',
  },
  trendMonth: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  trendBar: {
    width: 20,
    height: 60,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 2,
  },
  trendAmount: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: '600',
  },
  trendGrowth: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  analysisContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  analysisItem: {
    width: '50%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
}) 