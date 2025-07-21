import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'

interface Room {
  id: string
  name: string
  type: string
  floor: number
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_order'
  price: number
  features: string[]
  description?: string
}

const ROOM_TYPES = ['标准间', '豪华间', '套房', '总统套房', '家庭房']
const ROOM_FEATURES = ['空调', 'WiFi', '电视', '冰箱', '浴缸', '阳台', '保险箱', '迷你吧']

export default function RoomsScreen() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 'A101',
      name: 'A101',
      type: '标准间',
      floor: 1,
      status: 'available',
      price: 299,
      features: ['空调', 'WiFi', '电视'],
      description: '舒适的标准间，适合商务出行'
    },
    {
      id: 'A102',
      name: 'A102',
      type: '豪华间',
      floor: 1,
      status: 'occupied',
      price: 399,
      features: ['空调', 'WiFi', '电视', '冰箱'],
      description: '豪华装修，设施齐全'
    },
    {
      id: 'B201',
      name: 'B201',
      type: '套房',
      floor: 2,
      status: 'cleaning',
      price: 599,
      features: ['空调', 'WiFi', '电视', '冰箱', '浴缸', '阳台'],
      description: '宽敞的套房，享受奢华体验'
    }
  ])

  const [modalVisible, setModalVisible] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    floor: 1,
    price: 0,
    features: [] as string[],
    description: ''
  })

  const getStatusText = (status: string) => {
    const statusMap = {
      available: '可用',
      occupied: '已入住',
      cleaning: '清洁中',
      maintenance: '维修中',
      out_of_order: '停用'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      available: '#10b981',
      occupied: '#ef4444',
      cleaning: '#f59e0b',
      maintenance: '#8b5cf6',
      out_of_order: '#64748b'
    }
    return colorMap[status as keyof typeof colorMap] || '#64748b'
  }

  const handleAddRoom = () => {
    setEditingRoom(null)
    setFormData({
      name: '',
      type: ROOM_TYPES[0],
      floor: 1,
      price: 299,
      features: [],
      description: ''
    })
    setModalVisible(true)
  }

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      type: room.type,
      floor: room.floor,
      price: room.price,
      features: [...room.features],
      description: room.description || ''
    })
    setModalVisible(true)
  }

  const handleSaveRoom = () => {
    if (!formData.name.trim() || !formData.type) {
      Alert.alert('错误', '请填写完整的房间信息')
      return
    }

    if (editingRoom) {
      // 编辑现有房间
      setRooms(prev =>
        prev.map(room =>
          room.id === editingRoom.id
            ? {
                ...room,
                name: formData.name,
                type: formData.type,
                floor: formData.floor,
                price: formData.price,
                features: formData.features,
                description: formData.description
              }
            : room
        )
      )
    } else {
      // 添加新房间
      const newRoom: Room = {
        id: formData.name,
        name: formData.name,
        type: formData.type,
        floor: formData.floor,
        status: 'available',
        price: formData.price,
        features: formData.features,
        description: formData.description
      }
      setRooms(prev => [...prev, newRoom])
    }

    setModalVisible(false)
    Alert.alert('成功', editingRoom ? '房间信息已更新' : '房间已添加')
  }

  const handleDeleteRoom = (room: Room) => {
    Alert.alert(
      '删除房间',
      `确定要删除房间 ${room.name} 吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setRooms(prev => prev.filter(r => r.id !== room.id))
            Alert.alert('已删除', '房间已成功删除')
          }
        }
      ]
    )
  }

  const handleChangeStatus = (room: Room, newStatus: string) => {
    setRooms(prev =>
      prev.map(r =>
        r.id === room.id ? { ...r, status: newStatus as Room['status'] } : r
      )
    )
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const renderRoom = ({ item: room }: { item: Room }) => (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <View>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomType}>{room.type} • {room.floor}楼</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(room.status) }]}>
          <Text style={styles.statusText}>{getStatusText(room.status)}</Text>
        </View>
      </View>

      <View style={styles.roomInfo}>
        <Text style={styles.roomPrice}>¥{room.price}/晚</Text>
        <View style={styles.featuresContainer}>
          {room.features.slice(0, 3).map(feature => (
            <Text key={feature} style={styles.featureTag}>{feature}</Text>
          ))}
          {room.features.length > 3 && (
            <Text style={styles.featureTag}>+{room.features.length - 3}</Text>
          )}
        </View>
      </View>

      {room.description && (
        <Text style={styles.roomDescription}>{room.description}</Text>
      )}

      <View style={styles.roomActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditRoom(room)}
        >
          <Text style={styles.actionButtonText}>编辑</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert(
              '更改状态',
              '选择房间状态',
              [
                { text: '可用', onPress: () => handleChangeStatus(room, 'available') },
                { text: '清洁中', onPress: () => handleChangeStatus(room, 'cleaning') },
                { text: '维修中', onPress: () => handleChangeStatus(room, 'maintenance') },
                { text: '停用', onPress: () => handleChangeStatus(room, 'out_of_order') },
                { text: '取消', style: 'cancel' }
              ]
            )
          }}
        >
          <Text style={styles.actionButtonText}>状态</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteRoom(room)}
        >
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>房间管理</Text>
        <TouchableOpacity onPress={handleAddRoom}>
          <Text style={styles.addButton}>+ 添加</Text>
        </TouchableOpacity>
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{rooms.length}</Text>
          <Text style={styles.statLabel}>总房间数</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{rooms.filter(r => r.status === 'available').length}</Text>
          <Text style={styles.statLabel}>可用房间</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{rooms.filter(r => r.status === 'occupied').length}</Text>
          <Text style={styles.statLabel}>已入住</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{rooms.filter(r => r.status === 'cleaning').length}</Text>
          <Text style={styles.statLabel}>清洁中</Text>
        </View>
      </View>

      {/* 房间列表 */}
      <FlatList
        data={rooms}
        keyExtractor={item => item.id}
        renderItem={renderRoom}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* 添加/编辑房间弹窗 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingRoom ? '编辑房间' : '添加房间'}
            </Text>

            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="房间号码（如：A101）"
            />

            <Text style={styles.fieldLabel}>房间类型</Text>
            <View style={styles.typeSelector}>
              {ROOM_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.type === type && styles.typeButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === type && styles.typeButtonTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>楼层</Text>
                <TextInput
                  style={styles.input}
                  value={formData.floor.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, floor: parseInt(text) || 1 }))}
                  placeholder="楼层"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>价格/晚</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: parseInt(text) || 0 }))}
                  placeholder="价格"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>房间设施</Text>
            <View style={styles.featuresGrid}>
              {ROOM_FEATURES.map(feature => (
                <TouchableOpacity
                  key={feature}
                  style={[
                    styles.featureButton,
                    formData.features.includes(feature) && styles.featureButtonActive
                  ]}
                  onPress={() => toggleFeature(feature)}
                >
                  <Text style={[
                    styles.featureButtonText,
                    formData.features.includes(feature) && styles.featureButtonTextActive
                  ]}>
                    {feature}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="房间描述（可选）"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveRoom}
              >
                <Text style={styles.confirmButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  roomType: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  roomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  featureTag: {
    fontSize: 10,
    color: '#6366f1',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roomDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  roomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  featureButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  featureButtonActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#8b5cf6',
  },
  featureButtonText: {
    fontSize: 11,
    color: '#64748b',
  },
  featureButtonTextActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}) 