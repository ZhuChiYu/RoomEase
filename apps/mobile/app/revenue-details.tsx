import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')

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
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const revenueData: Record<string, RevenueData> = {
    today: {
      period: '今日',
      totalRevenue: 12580,
      roomRevenue: 10800,
      serviceRevenue: 1200,
      otherRevenue: 580,
      growth: 8.5
    },
    week: {
      period: '本周',
      totalRevenue: 78900,
      roomRevenue: 68500,
      serviceRevenue: 7200,
      otherRevenue: 3200,
      growth: 12.3
    },
    month: {
      period: '本月',
      totalRevenue: 324580,
      roomRevenue: 285600,
      serviceRevenue: 28900,
      otherRevenue: 10080,
      growth: 15.8
    },
    quarter: {
      period: '本季度',
      totalRevenue: 948760,
      roomRevenue: 825400,
      serviceRevenue: 85300,
      otherRevenue: 38060,
      growth: 18.2
    },
    year: {
      period: '本年度',
      totalRevenue: 3784520,
      roomRevenue: 3298600,
      serviceRevenue: 342800,
      otherRevenue: 143120,
      growth: 22.5
    }
  }

  const currentData = revenueData[selectedPeriod]

  const monthlyTrend = [
    { month: '1月', revenue: 280000, growth: 12.5 },
    { month: '2月', revenue: 295000, growth: 15.2 },
    { month: '3月', revenue: 324580, growth: 15.8 },
    { month: '4月', revenue: 0, growth: 0 }, // 预测
  ]

  const revenueBreakdown = [
    { type: '房费收入', amount: currentData.roomRevenue, percentage: (currentData.roomRevenue / currentData.totalRevenue * 100) },
    { type: '服务收入', amount: currentData.serviceRevenue, percentage: (currentData.serviceRevenue / currentData.totalRevenue * 100) },
    { type: '其他收入', amount: currentData.otherRevenue, percentage: (currentData.otherRevenue / currentData.totalRevenue * 100) },
  ]

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
            value={`¥${currentData.totalRevenue.toLocaleString()}`}
            subtitle="较上期增长"
            growth={currentData.growth}
            color="#6366f1"
          />
        </View>

        {/* 收入分类 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>收入构成</Text>
          <View style={styles.breakdownContainer}>
            {revenueBreakdown.map((item, index) => (
              <View key={index} style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownType}>{item.type}</Text>
                  <Text style={styles.breakdownPercentage}>{item.percentage.toFixed(1)}%</Text>
                </View>
                <Text style={styles.breakdownAmount}>¥{item.amount.toLocaleString()}</Text>
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
              monthlyTrend.map((item, index) => (
                <View key={index} style={styles.trendItem}>
                  <Text style={styles.trendMonth}>{item.month}</Text>
                  <View style={styles.trendBar}>
                    <View 
                      style={[
                        styles.trendBarFill,
                        { 
                          height: item.revenue > 0 ? `${(item.revenue / 350000) * 100}%` : '0%',
                          backgroundColor: item.revenue > 0 ? '#6366f1' : '#e2e8f0'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.trendAmount}>
                    {item.revenue > 0 ? `¥${(item.revenue / 1000).toFixed(0)}k` : '预测'}
                  </Text>
                  {item.growth > 0 && (
                    <Text style={[styles.trendGrowth, { color: '#10b981' }]}>
                      +{item.growth}%
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* 详细分析 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>收入分析</Text>
          <View style={styles.analysisContainer}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>平均房价</Text>
              <Text style={styles.analysisValue}>¥{Math.round(currentData.roomRevenue / 45)}</Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>入住率</Text>
              <Text style={styles.analysisValue}>78%</Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>RevPAR</Text>
              <Text style={styles.analysisValue}>¥{Math.round(currentData.roomRevenue / 45 * 0.78)}</Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>服务收入占比</Text>
              <Text style={styles.analysisValue}>{(currentData.serviceRevenue / currentData.totalRevenue * 100).toFixed(1)}%</Text>
            </View>
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