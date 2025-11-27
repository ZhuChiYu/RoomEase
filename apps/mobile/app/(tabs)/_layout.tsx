import { Tabs } from 'expo-router'
import { Text, View } from 'react-native'

function TabBarIcon({ name, color }: { name: string; color: string }) {
  // 简化的图标组件，实际项目中可以使用 react-native-vector-icons
  return (
    <View style={{ 
      width: 24, 
      height: 24, 
      backgroundColor: color, 
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
        {name[0].toUpperCase()}
      </Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '房态日历',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: '预订管理',
          tabBarIcon: ({ color }) => <TabBarIcon name="reservations" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: '统计',
          tabBarIcon: ({ color }) => <TabBarIcon name="statistics" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '个人中心',
          tabBarIcon: ({ color }) => <TabBarIcon name="profile" color={color} />,
        }}
      />
      <Tabs.Screen
        name="developer"
        options={{
          title: '开发者',
          tabBarIcon: ({ color }) => <TabBarIcon name="developer" color={color} />,
        }}
      />
    </Tabs>
  )
} 