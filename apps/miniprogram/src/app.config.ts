export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/calendar/index',
    'pages/reservations/index',
    'pages/profile/index',
    'pages/reservation-detail/index',
    'pages/login/index'
  ],
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#6366f1',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/calendar/index',
        text: '房态',
        iconPath: 'assets/icons/calendar.png',
        selectedIconPath: 'assets/icons/calendar-active.png'
      },
      {
        pagePath: 'pages/reservations/index',
        text: '预订',
        iconPath: 'assets/icons/reservation.png',
        selectedIconPath: 'assets/icons/reservation-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6366f1',
    navigationBarTitleText: 'RoomEase',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f8fafc'
  },
  lazyCodeLoading: 'requiredComponents'
})

function defineAppConfig(config: any) {
  return config
} 