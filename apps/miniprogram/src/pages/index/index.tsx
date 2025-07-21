import { Component } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface State {
  kpiData: Array<{
    title: string
    value: string | number
    description?: string
    trend?: {
      value: number
      isPositive: boolean
    }
  }>
  recentReservations: Array<{
    id: string
    guestName: string
    room: string
    checkIn: string
    status: string
  }>
}

export default class Index extends Component<{}, State> {
  constructor(props) {
    super(props)
    this.state = {
      kpiData: [
        {
          title: '今日入住',
          value: 12,
          description: '计划入住 15 间',
          trend: { value: 8.2, isPositive: true }
        },
        {
          title: '今日退房',
          value: 8,
          description: '计划退房 10 间',
          trend: { value: -2.1, isPositive: false }
        },
        {
          title: '当前在住',
          value: 45,
          description: '入住率 78%',
          trend: { value: 12.5, isPositive: true }
        },
        {
          title: '本月收入',
          value: '¥156,847',
          description: '较上月增长',
          trend: { value: 15.3, isPositive: true }
        }
      ],
      recentReservations: [
        {
          id: 'RES001',
          guestName: '张三',
          room: 'A101',
          checkIn: '2024-01-15',
          status: 'confirmed'
        },
        {
          id: 'RES002',
          guestName: '李四',
          room: 'A102',
          checkIn: '2024-01-15',
          status: 'pending'
        },
        {
          id: 'RES003',
          guestName: '王五',
          room: 'B201',
          checkIn: '2024-01-16',
          status: 'confirmed'
        }
      ]
    }
  }

  componentDidMount() {
    // 页面加载时获取数据
    this.loadDashboardData()
  }

  componentDidShow() {
    // 页面显示时刷新数据
    this.loadDashboardData()
  }

  loadDashboardData = async () => {
    try {
      Taro.showLoading({ title: '加载中...' })
      
      // 这里应该调用实际的API接口
      // const kpiData = await api.getDashboardKPI()
      // const recentReservations = await api.getRecentReservations()
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      Taro.hideLoading()
      
      // 更新数据
      // this.setState({ kpiData, recentReservations })
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  }

  navigateToReservations = () => {
    Taro.switchTab({
      url: '/pages/reservations/index'
    })
  }

  navigateToCalendar = () => {
    Taro.switchTab({
      url: '/pages/calendar/index'
    })
  }

  handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-reservation':
        Taro.showToast({
          title: '新建预订功能开发中',
          icon: 'none'
        })
        break
      case 'room-status':
        this.navigateToCalendar()
        break
      case 'check-in':
        Taro.showToast({
          title: '客人入住功能开发中',
          icon: 'none'
        })
        break
      case 'check-out':
        Taro.showToast({
          title: '客人退房功能开发中',
          icon: 'none'
        })
        break
    }
  }

  handleReservationClick = (reservationId: string) => {
    Taro.navigateTo({
      url: `/pages/reservation-detail/index?id=${reservationId}`
    })
  }

  render() {
    const { kpiData, recentReservations } = this.state

    return (
      <View className='index'>
        {/* 页面头部 */}
        <View className='header'>
          <Text className='greeting'>早上好</Text>
          <Text className='subtitle'>阳光民宿管理系统</Text>
        </View>

        {/* KPI 卡片 */}
        <View className='kpi-container'>
          {kpiData.map((kpi, index) => (
            <View key={index} className='kpi-card'>
              <View className='kpi-header'>
                <Text className='kpi-title'>{kpi.title}</Text>
                {kpi.trend && (
                  <Text className={`trend ${kpi.trend.isPositive ? 'trend-positive' : 'trend-negative'}`}>
                    {kpi.trend.isPositive ? '+' : ''}{kpi.trend.value}%
                  </Text>
                )}
              </View>
              <Text className='kpi-value'>{kpi.value}</Text>
              {kpi.description && (
                <Text className='kpi-description'>{kpi.description}</Text>
              )}
            </View>
          ))}
        </View>

        {/* 快捷操作 */}
        <View className='section'>
          <Text className='section-title'>快捷操作</Text>
          <View className='quick-actions'>
            <View className='action-row'>
              <View 
                className='action-button' 
                onClick={() => this.handleQuickAction('new-reservation')}
              >
                <Text className='action-text'>新建预订</Text>
              </View>
              <View 
                className='action-button' 
                onClick={() => this.handleQuickAction('room-status')}
              >
                <Text className='action-text'>房态管理</Text>
              </View>
            </View>
            <View className='action-row'>
              <View 
                className='action-button' 
                onClick={() => this.handleQuickAction('check-in')}
              >
                <Text className='action-text'>客人入住</Text>
              </View>
              <View 
                className='action-button' 
                onClick={() => this.handleQuickAction('check-out')}
              >
                <Text className='action-text'>客人退房</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 最近预订 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>最近预订</Text>
            <Text 
              className='section-link' 
              onClick={this.navigateToReservations}
            >
              查看全部
            </Text>
          </View>
          <View className='reservation-list'>
            {recentReservations.map((reservation) => (
              <View 
                key={reservation.id} 
                className='reservation-item'
                onClick={() => this.handleReservationClick(reservation.id)}
              >
                <View className='reservation-info'>
                  <Text className='guest-name'>{reservation.guestName}</Text>
                  <Text className='room-info'>{reservation.room} • {reservation.checkIn}</Text>
                </View>
                <View className={`status-badge status-${reservation.status}`}>
                  <Text className='status-text'>
                    {reservation.status === 'confirmed' ? '已确认' : '待确认'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 刷新按钮 */}
        <View className='refresh-section'>
          <Button 
            className='refresh-button' 
            onClick={this.loadDashboardData}
          >
            刷新数据
          </Button>
        </View>
      </View>
    )
  }
} 