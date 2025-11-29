/**
 * 自定义弹窗组件 - 支持响应式字体
 * 替代 React Native 的 Alert，更好地适配系统字体大小
 */

import React from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { FontSizes, Spacings, ComponentSizes } from './responsive'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export interface CustomAlertButton {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

interface CustomAlertProps {
  visible: boolean
  title?: string
  message: string
  buttons?: CustomAlertButton[]
  onDismiss?: () => void
}

export function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: '确定', style: 'default' }],
  onDismiss,
}: CustomAlertProps) {
  const handleButtonPress = (button: CustomAlertButton) => {
    if (button.onPress) {
      button.onPress()
    }
    if (onDismiss) {
      onDismiss()
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {title && (
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>
          )}
          
          <Text style={styles.message} numberOfLines={0}>
            {message}
          </Text>

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.cancelButton,
                  button.style === 'destructive' && styles.destructiveButton,
                  buttons.length === 1 && styles.singleButton,
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

/**
 * 便捷方法 - 类似 Alert.alert 的使用方式
 */
export const showCustomAlert = (
  title: string,
  message: string,
  buttons?: CustomAlertButton[]
) => {
  // 这个需要在React组件中使用，这里只是类型定义
  // 实际使用时需要通过状态管理来控制显示
  console.warn('showCustomAlert 需要在组件中配合状态使用')
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacings.xl,
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.xxl,
    width: Math.min(SCREEN_WIDTH - 80, 320),
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: Spacings.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSizes.normal,
    color: '#4b5563',
    lineHeight: FontSizes.normal * 1.5,
    marginBottom: Spacings.xl,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacings.md,
  },
  button: {
    flex: 1,
    minHeight: ComponentSizes.buttonHeightSmall,
    backgroundColor: '#6366f1',
    borderRadius: ComponentSizes.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  singleButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#6b7280',
  },
  destructiveButtonText: {
    color: '#fff',
  },
})

