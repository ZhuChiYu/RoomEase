/**
 * 数据备份服务
 * 支持导入/导出所有本地数据
 */

import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import * as DocumentPicker from 'expo-document-picker'
import { storage } from './storage'
import { localDataService, getAllLocalData, saveAllLocalData } from './localDataService'
import type { Room, Reservation, RoomStatusData } from '../store/types'

// 备份数据结构
export interface BackupData {
  version: string
  timestamp: string
  data: {
    rooms: Room[]
    reservations: Reservation[]
    roomStatuses: RoomStatusData[]
  }
  metadata: {
    totalRooms: number
    totalReservations: number
    totalRoomStatuses: number
    exportedBy: string
    deviceInfo: string
  }
}

/**
 * 导出所有数据到JSON文件
 */
export const exportAllData = async (): Promise<{ success: boolean; message: string; filePath?: string }> => {
  try {
    console.log('📦 开始导出数据...')

    // 获取所有本地数据
    const { rooms, reservations, roomStatuses } = await getAllLocalData()

    // 构建备份数据
    const backupData: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        rooms,
        reservations,
        roomStatuses,
      },
      metadata: {
        totalRooms: rooms.length,
        totalReservations: reservations.length,
        totalRoomStatuses: roomStatuses.length,
        exportedBy: 'KemanCloud Mobile App',
        deviceInfo: `${FileSystem.platform}`,
      },
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const fileName = `kemancloud_backup_${timestamp}.json`
    const filePath = `${FileSystem.documentDirectory}${fileName}`

    // 写入文件
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(backupData, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    )

    console.log('✅ 数据导出成功:', filePath)

    // 检查设备是否支持分享
    const isAvailable = await Sharing.isAvailableAsync()
    if (isAvailable) {
      // 分享文件
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: '导出客满云数据',
        UTI: 'public.json',
      })
    }

    return {
      success: true,
      message: `成功导出 ${backupData.metadata.totalRooms} 个房间、${backupData.metadata.totalReservations} 个预订、${backupData.metadata.totalRoomStatuses} 条房态记录`,
      filePath,
    }
  } catch (error: any) {
    console.error('❌ 数据导出失败:', error)
    return {
      success: false,
      message: `导出失败: ${error.message || '未知错误'}`,
    }
  }
}

/**
 * 从JSON文件导入数据
 */
export const importDataFromFile = async (): Promise<{ success: boolean; message: string; data?: BackupData }> => {
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
        message: '用户取消了文件选择',
      }
    }

    const fileUri = result.assets[0].uri
    console.log('📄 选择的文件:', fileUri)

    // 读取文件内容
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    })

    // 解析JSON
    const backupData: BackupData = JSON.parse(fileContent)

    // 验证数据结构
    if (!backupData.version || !backupData.data) {
      throw new Error('无效的备份文件格式')
    }

    console.log('📊 备份数据信息:', backupData.metadata)

    return {
      success: true,
      message: `文件读取成功，包含 ${backupData.metadata.totalRooms} 个房间、${backupData.metadata.totalReservations} 个预订`,
      data: backupData,
    }
  } catch (error: any) {
    console.error('❌ 数据导入失败:', error)
    return {
      success: false,
      message: `导入失败: ${error.message || '未知错误'}`,
    }
  }
}

/**
 * 恢复备份数据（覆盖当前数据）
 */
export const restoreBackupData = async (
  backupData: BackupData,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`🔄 开始恢复数据 (模式: ${mode})...`)

    if (mode === 'replace') {
      // 替换模式：直接覆盖所有数据
      await saveAllLocalData(backupData.data)
      console.log('✅ 数据恢复完成（替换模式）')
      
      return {
        success: true,
        message: `成功恢复 ${backupData.metadata.totalRooms} 个房间、${backupData.metadata.totalReservations} 个预订`,
      }
    } else {
      // 合并模式：保留现有数据，添加新数据
      const currentData = await getAllLocalData()
      
      // 合并房间（去重）
      const roomMap = new Map<string, Room>()
      currentData.rooms.forEach(room => roomMap.set(room.id, room))
      backupData.data.rooms.forEach(room => roomMap.set(room.id, room))
      const mergedRooms = Array.from(roomMap.values())
      
      // 合并预订（去重）
      const reservationMap = new Map<string, Reservation>()
      currentData.reservations.forEach(res => reservationMap.set(res.id, res))
      backupData.data.reservations.forEach(res => reservationMap.set(res.id, res))
      const mergedReservations = Array.from(reservationMap.values())
      
      // 合并房态（去重）
      const statusKey = (s: RoomStatusData) => `${s.roomId}-${s.date}-${s.status}`
      const statusMap = new Map<string, RoomStatusData>()
      currentData.roomStatuses.forEach(status => statusMap.set(statusKey(status), status))
      backupData.data.roomStatuses.forEach(status => statusMap.set(statusKey(status), status))
      const mergedStatuses = Array.from(statusMap.values())
      
      await saveAllLocalData({
        rooms: mergedRooms,
        reservations: mergedReservations,
        roomStatuses: mergedStatuses,
      })
      
      console.log('✅ 数据恢复完成（合并模式）')
      
      return {
        success: true,
        message: `成功合并数据：${mergedRooms.length} 个房间、${mergedReservations.length} 个预订`,
      }
    }
  } catch (error: any) {
    console.error('❌ 数据恢复失败:', error)
    return {
      success: false,
      message: `恢复失败: ${error.message || '未知错误'}`,
    }
  }
}

/**
 * 清空所有本地数据
 */
export const clearAllData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🗑️ 开始清空所有数据...')

    await saveAllLocalData({
      rooms: [],
      reservations: [],
      roomStatuses: [],
    })

    console.log('✅ 所有数据已清空')

    return {
      success: true,
      message: '所有数据已成功清空',
    }
  } catch (error: any) {
    console.error('❌ 清空数据失败:', error)
    return {
      success: false,
      message: `清空失败: ${error.message || '未知错误'}`,
    }
  }
}

/**
 * 获取数据统计信息
 */
export const getDataStats = async () => {
  try {
    const { rooms, reservations, roomStatuses } = await getAllLocalData()

    const stats = {
      totalRooms: rooms.length,
      totalReservations: reservations.length,
      totalRoomStatuses: roomStatuses.length,
      reservationsByStatus: {
        pending: reservations.filter(r => r.status === 'pending').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        checkedIn: reservations.filter(r => r.status === 'checked-in').length,
        checkedOut: reservations.filter(r => r.status === 'checked-out').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
      },
      roomsByType: rooms.reduce((acc, room) => {
        acc[room.type] = (acc[room.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return stats
  } catch (error) {
    console.error('❌ 获取数据统计失败:', error)
    return null
  }
}

/**
 * 导出特定日期范围的预订数据
 */
export const exportReservationsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<{ success: boolean; message: string; filePath?: string }> => {
  try {
    console.log(`📦 导出 ${startDate} 到 ${endDate} 的预订数据...`)

    const reservations = await localDataService.reservations.getAll({ startDate, endDate })

    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dateRange: { startDate, endDate },
      data: reservations,
      metadata: {
      totalReservations: reservations.length,
      exportedBy: 'KemanCloud Mobile App',
      },
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const fileName = `kemancloud_reservations_${startDate}_to_${endDate}_${timestamp}.json`
    const filePath = `${FileSystem.documentDirectory}${fileName}`

    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(exportData, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    )

    const isAvailable = await Sharing.isAvailableAsync()
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: '导出预订数据',
      })
    }

    return {
      success: true,
      message: `成功导出 ${reservations.length} 个预订`,
      filePath,
    }
  } catch (error: any) {
    console.error('❌ 导出预订数据失败:', error)
    return {
      success: false,
      message: `导出失败: ${error.message || '未知错误'}`,
    }
  }
}

export default {
  exportAllData,
  importDataFromFile,
  restoreBackupData,
  clearAllData,
  getDataStats,
  exportReservationsByDateRange,
}
