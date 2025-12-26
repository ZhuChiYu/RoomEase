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

interface NightsWheelPickerProps {
  visible: boolean
  onClose: () => void
  onSelect: (nights: number) => void
  initialNights?: number
  title?: string
}

export function NightsWheelPicker({
  visible,
  onClose,
  onSelect,
  initialNights = 1,
  title = '选择入住时长'
}: NightsWheelPickerProps) {
  const [selectedNights, setSelectedNights] = useState(initialNights)
  const scrollRef = useRef<ScrollView>(null)
  const shouldScrollToInitial = useRef(false)

  // 使用 useMemo 缓存天数数组，避免不必要的重新生成
  const nights = useMemo(() => {
    return Array.from({ length: 365 }, (_, i) => i + 1)
  }, [])

  // 当弹窗打开或 initialNights 改变时，更新选中的值
  useEffect(() => {
    if (visible) {
      setSelectedNights(initialNights || 1)
      shouldScrollToInitial.current = true
    }
  }, [visible, initialNights])

  // 只在打开时滚动到初始位置
  useEffect(() => {
    if (visible && shouldScrollToInitial.current && selectedNights) {
      setTimeout(() => {
        const nightIndex = nights.indexOf(selectedNights)
        if (nightIndex !== -1 && scrollRef.current) {
          scrollRef.current.scrollTo({
            y: nightIndex * ITEM_HEIGHT,
            animated: false,
          })
        }
        shouldScrollToInitial.current = false
      }, 150)
    }
  }, [visible, selectedNights])

  const handleConfirm = () => {
    onSelect(selectedNights)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalContent}>
            {/* 头部 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelButton}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.confirmButton}>保存</Text>
              </TouchableOpacity>
            </View>

            {/* 时长显示 */}
            <View style={styles.nightsDisplay}>
              <Text style={styles.selectedNights}>
                {selectedNights}晚
              </Text>
            </View>

            {/* 滚轮选择器 */}
            <View style={styles.wheelPickerContainer}>
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
                    const night = nights[index]
                    if (night && night !== selectedNights) {
                      setSelectedNights(night)
                    }
                  }}
                  scrollEventThrottle={16}
                >
                  {nights.map((night) => (
                    <TouchableOpacity
                      key={night}
                      style={styles.wheelItem}
                      onPress={() => {
                        setSelectedNights(night)
                        // 自动滚动到选中项
                        const nightIndex = nights.indexOf(night)
                        if (nightIndex !== -1 && scrollRef.current) {
                          scrollRef.current.scrollTo({
                            y: nightIndex * ITEM_HEIGHT,
                            animated: true,
                          })
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.wheelItemText,
                          selectedNights === night && styles.selectedWheelItemText
                        ]}
                      >
                        {night}晚
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* 固定的选中指示器 */}
                <View style={styles.selectedIndicator} pointerEvents="none" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
    minHeight: height * 0.5,
    maxHeight: height * 0.65,
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
  nightsDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
  },
  selectedNights: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  wheelPickerContainer: {
    flexDirection: 'row',
    height: 240,
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  wheelContainer: {
    flex: 1,
    maxWidth: 200,
    position: 'relative',
  },
  wheel: {
    flex: 1,
  },
  wheelContent: {
    paddingVertical: (240 - ITEM_HEIGHT) / 2, // 让第一个和最后一个项目都能滚动到中间
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: (240 - ITEM_HEIGHT) / 2, // 固定在容器中间
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    opacity: 0.15,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  wheelItemText: {
    fontSize: 18,
    color: '#64748b',
  },
  selectedWheelItemText: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 20,
  },
})

// 添加默认导出
export default NightsWheelPicker

