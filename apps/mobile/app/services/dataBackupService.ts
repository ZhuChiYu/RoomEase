/**
 * 数据备份与导入导出服务
 * 支持将本地数据导出为JSON文件，以及从JSON文件导入数据
 */

import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as DocumentPicker from 'expo-document-picker'
import { Alert } from 'react-native'
import { storage, persistedStorage } from './storage'
import type { Room, Reservation, RoomStatusData, OperationLog } from '../store/types'

export interface BackupData {
  version: string
  exportDate: string
  data: {
    rooms: Room[]
    reservations: Reservation[]
    roomStatuses: RoomStatusData[]
    operationLogs?: OperationLog[]
  }
  metadata: {
    totalRooms: number
    totalReservations: number
    totalRoomStatuses: number
  }
}

/**
 * 导出所有数据到JSON文件
 */
export const exportData = async (options?: {
  includeRooms?: boolean
  includeReservations?: boolean
  includeRoomStatuses?: boolean
}): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    console.log('📤 开始导出数据...')
    
    const {
      includeRooms = true,
      includeReservations = true,
      includeRoomStatuses = true,
    } = options || {}

    // 获取当前Redux状态
    const persistedState = await persistedStorage.getState()
    
    if (!persistedState || !persistedState.calendar) {
      return {
        success: false,
        error: '没有找到可导出的数据',
      }
    }

    const { calendar } = persistedState
    
    // 构建导出数据
    const backupData: BackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data: {
        rooms: includeRooms ? calendar.rooms : [],
        reservations: includeReservations ? calendar.reservations : [],
        roomStatuses: includeRoomStatuses ? calendar.roomStatuses : [],
        operationLogs: calendar.operationLogs || [],
      },
      metadata: {
        totalRooms: includeRooms ? calendar.rooms.length : 0,
        totalReservations: includeReservations ? calendar.reservations.length : 0,
        totalRoomStatuses: includeRoomStatuses ? calendar.roomStatuses.length : 0,
      },
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const fileName = `RoomEase_Backup_${timestamp}.json`
    const filePath = `${FileSystem.documentDirectory}${fileName}`

    // 写入文件
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(backupData, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    )

    console.log('✅ 数据导出成功:', filePath)

    // 分享文件
    const canShare = await Sharing.isAvailableAsync()
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: '导出数据',
        UTI: 'public.json',
      })
    }

    return {
      success: true,
      filePath,
    }
  } catch (error: any) {
    console.error('❌ 数据导出失败:', error)
    return {
      success: false,
      error: error.message || '导出失败',
    }
  }
}

/**
 * 从JSON文件导入数据
 */
export const importData = async (options?: {
  mergeMode?: 'replace' | 'merge'  // replace: 完全替换; merge: 合并数据
}): Promise<{ success: boolean; data?: BackupData; error?: string }> => {
  try {
    console.log('📥 开始导入数据...')

    // 选择文件
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    })

    if (result.canceled) {
      return {
        success: false,
        error: '用户取消了选择',
      }
    }

    const fileUri = result.assets[0].uri
    console.log('📁 选择的文件:', fileUri)

    // 读取文件内容
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    })

    // 解析JSON
    const backupData: BackupData = JSON.parse(fileContent)

    // 验证数据格式
    if (!backupData.version || !backupData.data) {
      return {
        success: false,
        error: '无效的备份文件格式',
      }
    }

    console.log('✅ 数据解析成功:', backupData.metadata)

    return {
      success: true,
      data: backupData,
    }
  } catch (error: any) {
    console.error('❌ 数据导入失败:', error)
    return {
      success: false,
      error: error.message || '导入失败',
    }
  }
}

/**
 * 应用导入的数据到Redux store
 * 注意：这个函数需要在Redux store中调用相应的actions
 */
export const applyImportedData = (
  backupData: BackupData,
  mode: 'replace' | 'merge' = 'replace'
): {
  rooms: Room[]
  reservations: Reservation[]
  roomStatuses: RoomStatusData[]
  operationLogs: OperationLog[]
} => {
  console.log(`🔄 应用导入数据 (模式: ${mode})...`)
  
  // 对于replace模式，直接返回导入的数据
  // 对于merge模式，需要在外部与现有数据合并
  return {
    rooms: backupData.data.rooms,
    reservations: backupData.data.reservations,
    roomStatuses: backupData.data.roomStatuses,
    operationLogs: backupData.data.operationLogs || [],
  }
}

/**
 * 导出特定类型的数据
 */
export const exportSpecificData = async (
  dataType: 'rooms' | 'reservations' | 'roomStatuses' | 'all'
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  const options = {
    includeRooms: dataType === 'rooms' || dataType === 'all',
    includeReservations: dataType === 'reservations' || dataType === 'all',
    includeRoomStatuses: dataType === 'roomStatuses' || dataType === 'all',
  }

  return await exportData(options)
}

/**
 * 导出为CSV格式（用于Excel）
 */
export const exportToCSV = async (
  dataType: 'rooms' | 'reservations'
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    console.log(`📊 导出${dataType}数据为CSV...`)

    const persistedState = await persistedStorage.getState()
    
    if (!persistedState || !persistedState.calendar) {
      return {
        success: false,
        error: '没有找到可导出的数据',
      }
    }

    const { calendar } = persistedState
    let csvContent = ''
    let fileName = ''

    if (dataType === 'rooms') {
      // 房间数据CSV
      csvContent = '房间ID,房间号,房型\n'
      calendar.rooms.forEach((room: Room) => {
        csvContent += `${room.id},${room.name},${room.type}\n`
      })
      fileName = `RoomEase_Rooms_${new Date().toISOString().split('T')[0]}.csv`
    } else if (dataType === 'reservations') {
      // 预订数据CSV
      csvContent = '订单号,房间号,客人姓名,手机号,入住日期,退房日期,房价,总金额,入住天数,状态,创建时间\n'
      calendar.reservations.forEach((reservation: Reservation) => {
        csvContent += `${reservation.orderId},${reservation.roomNumber},${reservation.guestName},${reservation.guestPhone},${reservation.checkInDate},${reservation.checkOutDate},${reservation.roomPrice},${reservation.totalAmount},${reservation.nights},${reservation.status},${reservation.createdAt}\n`
      })
      fileName = `RoomEase_Reservations_${new Date().toISOString().split('T')[0]}.csv`
    }

    const filePath = `${FileSystem.documentDirectory}${fileName}`

    // 写入文件
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    })

    console.log('✅ CSV导出成功:', filePath)

    // 分享文件
    const canShare = await Sharing.isAvailableAsync()
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: '导出CSV',
      })
    }

    return {
      success: true,
      filePath,
    }
  } catch (error: any) {
    console.error('❌ CSV导出失败:', error)
    return {
      success: false,
      error: error.message || 'CSV导出失败',
    }
  }
}

/**
 * 清除所有本地数据（慎用）
 */
export const clearAllData = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🗑️ 清除所有本地数据...')
    
    await persistedStorage.clearState()
    await storage.clear()
    
    console.log('✅ 数据清除成功')
    
    return { success: true }
  } catch (error: any) {
    console.error('❌ 数据清除失败:', error)
    return {
      success: false,
      error: error.message || '清除失败',
    }
  }
}

/**
 * 获取数据统计信息
 */
export const getDataStatistics = async (): Promise<{
  rooms: number
  reservations: number
  roomStatuses: number
  storageSize: string
  lastBackupTime?: string
}> => {
  try {
    const persistedState = await persistedStorage.getState()
    
    if (!persistedState || !persistedState.calendar) {
      return {
        rooms: 0,
        reservations: 0,
        roomStatuses: 0,
        storageSize: '0 KB',
      }
    }

    const { calendar } = persistedState
    
    // 计算存储大小
    const dataSize = JSON.stringify(persistedState).length
    const sizeInKB = (dataSize / 1024).toFixed(2)
    
    return {
      rooms: calendar.rooms.length,
      reservations: calendar.reservations.length,
      roomStatuses: calendar.roomStatuses.length,
      storageSize: `${sizeInKB} KB`,
    }
  } catch (error) {
    console.error('获取数据统计失败:', error)
    return {
      rooms: 0,
      reservations: 0,
      roomStatuses: 0,
      storageSize: '0 KB',
    }
  }
}

