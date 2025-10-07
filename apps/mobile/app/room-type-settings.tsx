import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

interface RoomType {
  id: string;
  name: string;
  shortName: string;
  defaultPrice: number;
  rooms: string[];
}

export default function RoomTypeSettingsScreen() {
  const router = useRouter();
  
  // 示例数据 - 实际应该从全局状态或API获取
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    {
      id: '1',
      name: '大床房',
      shortName: '大床房',
      defaultPrice: 500,
      rooms: ['1202'],
    },
    {
      id: '2',
      name: '双人房',
      shortName: '双人房',
      defaultPrice: 600,
      rooms: [],
    },
    {
      id: '3',
      name: '2润',
      shortName: '单人房',
      defaultPrice: 400,
      rooms: [],
    },
  ]);

  const handleAddRoomType = () => {
    router.push('/edit-room-type');
  };

  const handleEditRoomType = (roomType: RoomType) => {
    router.push({
      pathname: '/edit-room-type',
      params: {
        id: roomType.id,
        name: roomType.name,
        shortName: roomType.shortName,
        defaultPrice: roomType.defaultPrice.toString(),
        rooms: JSON.stringify(roomType.rooms),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>房型房间设置</Text>
        <View style={{ width: 40 }} />
      </View>

      {roomTypes.length === 0 ? (
        /* 空状态 */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📁</Text>
          </View>
          <Text style={styles.emptyText}>暂无房型房间</Text>
          <Text style={styles.emptySubText}>点击新增按钮即可创建房型房间</Text>
        </View>
      ) : (
        /* 房型列表 */
        <ScrollView style={styles.content}>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>共 {roomTypes.length} 个房型</Text>
          </View>

          {roomTypes.map((roomType) => (
            <TouchableOpacity
              key={roomType.id}
              style={styles.roomTypeCard}
              onPress={() => handleEditRoomType(roomType)}
            >
              <View style={styles.roomTypeHeader}>
                <View>
                  <Text style={styles.roomTypeName}>{roomType.name}</Text>
                  <Text style={styles.roomTypeSubName}>{roomType.shortName}</Text>
                </View>
                <View style={styles.roomTypeRight}>
                  <Text style={styles.roomCount}>{roomType.rooms.length}间</Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 底部新增按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddRoomType}>
          <Text style={styles.addButtonText}>新增</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    width: 120,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  summary: {
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  summaryText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  roomTypeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    padding: 15,
  },
  roomTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roomTypeSubName: {
    fontSize: 14,
    color: '#999',
  },
  roomTypeRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomCount: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#1890ff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

