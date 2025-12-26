import React, { useState, useRef, useEffect, useMemo } from 'react'
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
const ITEM_HEIGHT = 44 // 每个选项的高度

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

  // 为每个滚轮创建 ref
  const yearScrollRef = useRef<ScrollView>(null)
  const monthScrollRef = useRef<ScrollView>(null)
  const dayScrollRef = useRef<ScrollView>(null)
  
  // 跟踪是否需要滚动到初始位置
  const shouldScrollToInitial = useRef(false)

  // 使用 useMemo 缓存数组，避免不必要的重新生成
  const years = useMemo(() => {
    const yearsList = []
    for (let i = currentDate.getFullYear() - 5; i <= currentDate.getFullYear() + 5; i++) {
      yearsList.push(i)
    }
    return yearsList
  }, [])

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }, [])

  const days = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [selectedYear, selectedMonth])
  
  // 当月份改变时，检查并调整选中的日期
  useEffect(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth)
    }
  }, [selectedYear, selectedMonth])

  // 当弹窗打开或 initialDate 改变时，更新选中的日期
  useEffect(() => {
    if (visible) {
      const newInitDate = initialDate ? new Date(initialDate) : currentDate
      setSelectedYear(newInitDate.getFullYear())
      setSelectedMonth(newInitDate.getMonth() + 1)
      setSelectedDay(newInitDate.getDate())
      shouldScrollToInitial.current = true
    }
  }, [visible, initialDate])

  // 只在打开时滚动到初始位置
  useEffect(() => {
    if (visible && shouldScrollToInitial.current) {
      setTimeout(() => {
        // 滚动到选中的年份
        const yearIndex = years.indexOf(selectedYear)
        if (yearIndex !== -1 && yearScrollRef.current) {
          yearScrollRef.current.scrollTo({
            y: yearIndex * ITEM_HEIGHT,
            animated: false,
          })
        }

        // 滚动到选中的月份
        const monthIndex = months.indexOf(selectedMonth)
        if (monthIndex !== -1 && monthScrollRef.current) {
          monthScrollRef.current.scrollTo({
            y: monthIndex * ITEM_HEIGHT,
            animated: false,
          })
        }

        // 滚动到选中的日期
        const dayIndex = days.indexOf(selectedDay)
        if (dayIndex !== -1 && dayScrollRef.current) {
          dayScrollRef.current.scrollTo({
            y: dayIndex * ITEM_HEIGHT,
            animated: false,
          })
        }
        
        shouldScrollToInitial.current = false
      }, 150)
    }
  }, [visible, selectedYear, selectedMonth, selectedDay])

  const handleConfirm = () => {
    const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`
    onSelect(formattedDate)
    onClose()
  }

  const renderWheelPicker = (
    items: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    unit: string,
    scrollRef: React.RefObject<ScrollView>
  ) => {
    return (
      <View style={styles.wheelContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.wheel}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.wheelContent}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y
            const index = Math.round(offsetY / ITEM_HEIGHT)
            const item = items[index]
            if (item && item !== selectedValue) {
              onValueChange(item)
            }
          }}
          scrollEventThrottle={16}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.wheelItem}
              onPress={() => {
                onValueChange(item)
                // 自动滚动到选中项
                const itemIndex = items.indexOf(item)
                if (itemIndex !== -1 && scrollRef.current) {
                  scrollRef.current.scrollTo({
                    y: itemIndex * ITEM_HEIGHT,
                    animated: true,
                  })
                }
              }}
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
      animationType="none"
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
          <View style={styles.wheelPickerWrapper}>
            <View style={styles.wheelPickerContainer}>
              {renderWheelPicker(years, selectedYear, setSelectedYear, '年', yearScrollRef)}
              {renderWheelPicker(months, selectedMonth, setSelectedMonth, '月', monthScrollRef)}
              {renderWheelPicker(days, selectedDay, setSelectedDay, '日', dayScrollRef)}
            </View>
            {/* 固定的选中指示器 - 覆盖所有滚轮 */}
            <View style={styles.globalSelectedIndicator} pointerEvents="none" />
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
    paddingBottom: 60,
    minHeight: height * 0.65,
    maxHeight: height * 0.8,
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
  wheelPickerWrapper: {
    position: 'relative',
    height: 200,
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
    paddingVertical: (200 - ITEM_HEIGHT) / 2, // 让第一个和最后一个项目都能滚动到中间
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  globalSelectedIndicator: {
    position: 'absolute',
    top: (200 - ITEM_HEIGHT) / 2, // 固定在容器中间
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    opacity: 0.15,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  wheelItemText: {
    fontSize: 16,
    color: '#64748b',
  },
  selectedWheelItemText: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 18,
  },
})

// 添加默认导出
export default DateWheelPicker 