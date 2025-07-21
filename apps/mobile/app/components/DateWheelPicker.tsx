import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native'

const { height } = Dimensions.get('window')

interface DateWheelPickerProps {
  visible: boolean
  onClose: () => void
  onSelect: (date: string) => void
  initialDate?: string
  title?: string
}

export function DateWheelPicker({
  visible,
  onClose,
  onSelect,
  initialDate,
  title = '选择日期'
}: DateWheelPickerProps) {
  const currentDate = new Date()
  const initDate = initialDate ? new Date(initialDate) : currentDate
  
  const [selectedYear, setSelectedYear] = useState(initDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(initDate.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(initDate.getDate())

  // 生成年份选项（当前年份前后5年）
  const generateYears = () => {
    const years = []
    for (let i = currentDate.getFullYear() - 5; i <= currentDate.getFullYear() + 5; i++) {
      years.push(i)
    }
    return years
  }

  // 生成月份选项
  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }

  // 生成日期选项
  const generateDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }

  const years = generateYears()
  const months = generateMonths()
  const days = generateDays()

  const handleConfirm = () => {
    const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`
    onSelect(formattedDate)
    onClose()
  }

  const renderWheelPicker = (
    items: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    unit: string
  ) => {
    return (
      <View style={styles.wheelContainer}>
        <ScrollView
          style={styles.wheel}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.wheelContent}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.wheelItem,
                selectedValue === item && styles.selectedWheelItem
              ]}
              onPress={() => onValueChange(item)}
            >
              <Text
                style={[
                  styles.wheelItemText,
                  selectedValue === item && styles.selectedWheelItemText
                ]}
              >
                {item}{unit}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* 头部 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmButton}>确定</Text>
            </TouchableOpacity>
          </View>

          {/* 日期显示 */}
          <View style={styles.dateDisplay}>
            <Text style={styles.selectedDate}>
              {selectedYear}年{selectedMonth}月{selectedDay}日
            </Text>
          </View>

          {/* 滚轮选择器 */}
          <View style={styles.wheelPickerContainer}>
            {renderWheelPicker(years, selectedYear, setSelectedYear, '年')}
            {renderWheelPicker(months, selectedMonth, setSelectedMonth, '月')}
            {renderWheelPicker(days, selectedDay, setSelectedDay, '日')}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: height * 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748b',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  confirmButton: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  dateDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
  },
  selectedDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  wheelPickerContainer: {
    flexDirection: 'row',
    height: 200,
    paddingHorizontal: 20,
  },
  wheelContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  wheel: {
    flex: 1,
  },
  wheelContent: {
    paddingVertical: 60,
  },
  wheelItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedWheelItem: {
    backgroundColor: '#6366f1',
  },
  wheelItemText: {
    fontSize: 16,
    color: '#64748b',
  },
  selectedWheelItemText: {
    color: 'white',
    fontWeight: 'bold',
  },
})

// 添加默认导出
export default DateWheelPicker 