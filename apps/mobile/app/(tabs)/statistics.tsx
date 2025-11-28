import React, { useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { dataService } from '../services/dataService';
import { setRooms, setReservations, setRoomStatuses } from '../store/calendarSlice';

const { width } = Dimensions.get('window');

type StatPeriod = 'day' | 'month' | 'year';

export default function StatisticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<StatPeriod>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useAppDispatch();
  
  // 从Redux获取预订数据
  const reservations = useAppSelector(state => state.calendar.reservations);
  const rooms = useAppSelector(state => state.calendar.rooms);

  // 加载数据
  const loadData = useCallback(async () => {
    // 如果已经有数据，跳过加载
    if (reservations.length > 0) {
      console.log('📊 [统计] 数据已存在，跳过加载');
      return;
    }
    
    try {
      console.log('📊 [统计] 开始加载数据...');
      
      // 计算日期范围（今天往前90天，往后30天）
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 30);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // 并行加载数据
      const [roomsData, reservationsData, roomStatusesData] = await Promise.all([
        dataService.rooms.getAll(),
        dataService.reservations.getAll({
          startDate: startDateStr,
          endDate: endDateStr,
        }),
        dataService.roomStatus.getByDateRange(startDateStr, endDateStr)
      ]);
      
      console.log('📊 [统计] 数据加载完成:', {
        rooms: roomsData.length,
        reservations: reservationsData.length,
      });
      
      // 更新Redux
      dispatch(setRooms(roomsData));
      dispatch(setReservations(reservationsData));
      dispatch(setRoomStatuses(Array.isArray(roomStatusesData) ? roomStatusesData : []));
    } catch (error) {
      console.error('❌ [统计] 数据加载失败:', error);
    }
  }, [reservations.length, dispatch]);
  
  // 页面获得焦点时加载数据
  useFocusEffect(
    useCallback(() => {
      console.log('📊 [统计] 页面获得焦点');
      loadData();
    }, [loadData])
  );

  // 下拉刷新处理
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 [统计] 下拉刷新，清除缓存...');
      await dataService.cache.clearAll();
      console.log('✅ [统计] 缓存已清除，重新加载数据...');
      await loadData();
    } catch (error) {
      console.error('❌ [统计] 刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 计算统计数据
  const statistics = useMemo(() => {
    console.log('📊 [统计] 开始计算统计数据...');
    console.log('📊 [统计] 预订总数:', reservations.length);
    console.log('📊 [统计] 房间总数:', rooms.length);
    
    const now = new Date();
    let filteredReservations = reservations.map((r: any) => r); // 类型断言

    // 格式化日期为 YYYY-MM-DD
    const formatDateStr = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      } catch {
        return dateStr;
      }
    };

    // 根据时间周期筛选
    if (selectedPeriod === 'day') {
      const dateStr = selectedDate.toISOString().split('T')[0];
      filteredReservations = reservations.filter((r: any) => {
        const checkIn = formatDateStr(r.checkInDate);
        const checkOut = formatDateStr(r.checkOutDate);
        return checkIn <= dateStr && checkOut > dateStr;
      });
      console.log('📊 [统计] 按日筛选:', dateStr, '结果数:', filteredReservations.length);
    } else if (selectedPeriod === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      filteredReservations = reservations.filter((r: any) => {
        const checkIn = new Date(r.checkInDate);
        return checkIn.getFullYear() === year && checkIn.getMonth() + 1 === month;
      });
      console.log('📊 [统计] 按月筛选:', `${year}-${month}`, '结果数:', filteredReservations.length);
    } else if (selectedPeriod === 'year') {
      const year = selectedDate.getFullYear();
      filteredReservations = reservations.filter((r: any) => {
        const checkIn = new Date(r.checkInDate);
        return checkIn.getFullYear() === year;
      });
      console.log('📊 [统计] 按年筛选:', year, '结果数:', filteredReservations.length);
    }

    // 总营收
    const totalRevenue = filteredReservations.reduce((sum, r: any) => sum + (Number(r.totalAmount) || 0), 0);

    // 订单数
    const orderCount = filteredReservations.length;

    // 按渠道统计
    const channelStats = filteredReservations.reduce((acc, r: any) => {
      const channel = r.source || r.channel || '直订'; // 兼容source和channel
      if (!acc[channel]) {
        acc[channel] = { count: 0, revenue: 0 };
      }
      acc[channel].count += 1;
      acc[channel].revenue += Number(r.totalAmount) || 0;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    // 按房间统计
    const roomStats = filteredReservations.reduce((acc, r: any) => {
      const roomId = r.roomId || '未知';
      // 从房间列表查找房间信息
      const room = rooms.find(room => room.id === roomId);
      const roomName = room?.name || r.roomNumber || r.room?.name || '未知房间';
      
      if (!acc[roomId]) {
        acc[roomId] = { count: 0, revenue: 0, roomNumber: roomName };
      }
      acc[roomId].count += 1;
      acc[roomId].revenue += Number(r.totalAmount) || 0;
      return acc;
    }, {} as Record<string, { count: number; revenue: number; roomNumber: string }>);

    console.log('📊 [统计] 计算结果:', {
      totalRevenue,
      orderCount,
      channelCount: Object.keys(channelStats).length,
      roomCount: Object.keys(roomStats).length,
    });

    return {
      totalRevenue,
      orderCount,
      channelStats,
      roomStats,
    };
  }, [reservations, rooms, selectedPeriod, selectedDate]);

  const formatDate = (date: Date) => {
    if (selectedPeriod === 'day') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    } else if (selectedPeriod === 'month') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    } else {
      return `${date.getFullYear()}年`;
    }
  };

  const changePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (selectedPeriod === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  return (
    <View style={styles.container}>
      {/* 时间周期选择 */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'day' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('day')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'day' && styles.periodButtonTextActive]}>
            日
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
            月
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('year')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.periodButtonTextActive]}>
            年
          </Text>
        </TouchableOpacity>
      </View>

      {/* 日期导航 */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changePeriod('prev')} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity onPress={() => changePeriod('next')} style={styles.navButton}>
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4a90e2"
            colors={['#4a90e2']}
          />
        }
      >
        {/* 总览卡片 */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>总营收</Text>
            <Text style={styles.overviewValue}>¥{statistics.totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>订单数</Text>
            <Text style={styles.overviewValue}>{statistics.orderCount}</Text>
          </View>
        </View>

        {/* 营收趋势图 */}
        {selectedPeriod === 'month' && (() => {
          // 计算每日真实营收
          const year = selectedDate.getFullYear();
          const month = selectedDate.getMonth() + 1;
          const daysInMonth = new Date(year, month, 0).getDate();
          
          // 初始化每日营收为0
          const dailyRevenue: number[] = new Array(daysInMonth).fill(0);
          
          // 统计每日营收
          reservations.forEach((r: any) => {
            const checkIn = new Date(r.checkInDate);
            if (checkIn.getFullYear() === year && checkIn.getMonth() + 1 === month) {
              const day = checkIn.getDate();
              if (day >= 1 && day <= daysInMonth) {
                dailyRevenue[day - 1] += Number(r.totalAmount) || 0;
              }
            }
          });
          
          // 选择采样点（显示7个点）
          const samplePoints = [1, 5, 10, 15, 20, 25, Math.min(30, daysInMonth)];
          const labels = samplePoints.map(d => `${d}日`);
          const data = samplePoints.map(d => dailyRevenue[d - 1] || 0);
          
          // 确保至少有一个非零值，否则图表会报错
          const hasData = data.some(v => v > 0);
          const chartData = hasData ? data : [0, 0, 0, 0, 0, 0, 1];
          
          console.log('📊 [统计] 营收趋势:', { year, month, daysInMonth, samplePoints, data });
          
          return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>营收趋势</Text>
            <LineChart
              data={{
                  labels: labels,
                datasets: [
                  {
                      data: chartData,
                  },
                ],
              }}
              width={width - 60}
              height={220}
              yAxisLabel="¥"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#6366f1',
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
          );
        })()}

        {/* 渠道分布饼图 */}
        {Object.entries(statistics.channelStats).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>渠道分布</Text>
            <PieChart
              data={Object.entries(statistics.channelStats).map(([channel, data], index) => ({
                name: channel,
                population: data.revenue,
                color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5],
                legendFontColor: '#333',
                legendFontSize: 12,
              }))}
              width={width - 60}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        )}

        {/* 渠道统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>渠道汇总</Text>
          {Object.entries(statistics.channelStats).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无数据</Text>
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>渠道</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>订单数</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>营收</Text>
              </View>
              {Object.entries(statistics.channelStats)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([channel, data]) => (
                  <View key={channel} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{channel}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{data.count}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>¥{data.revenue.toFixed(2)}</Text>
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* 房间统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>房间汇总</Text>
          {Object.entries(statistics.roomStats).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无数据</Text>
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>房间号</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>订单数</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>营收</Text>
              </View>
              {Object.entries(statistics.roomStats)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([roomId, data]) => (
                  <View key={roomId} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{data.roomNumber}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{data.count}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>¥{data.revenue.toFixed(2)}</Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    justifyContent: 'center',
    gap: 10,
  },
  periodButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: 60,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#6366f1',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

