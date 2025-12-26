import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native'
import { Stack, router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { orderOcrService, OrderInfo } from './services/orderOcrService'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function OrderScanScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognizedInfo, setRecognizedInfo] = useState<OrderInfo | null>(null)

  // 选择图片
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        setSelectedImage(imageUri)
        setRecognizedInfo(null)
        
        // 自动开始识别
        await recognizeOrder(imageUri)
      }
    } catch (error) {
      console.error('选择图片失败:', error)
      Alert.alert('错误', '选择图片失败，请重试')
    }
  }

  // 识别订单
  const recognizeOrder = async (imageUri: string) => {
    setIsProcessing(true)
    try {
      const result = await orderOcrService.recognizeOrderScreenshot(imageUri)
      setRecognizedInfo(result)

      // 验证识别结果
      const validation = orderOcrService.validateOrderInfo(result)
      if (!validation.valid) {
        Alert.alert(
          '提示',
          `识别完成，但以下信息缺失：\n${validation.missingFields.join('、')}\n\n您可以在下一步手动补充。`,
          [{ text: '知道了' }]
        )
      }
    } catch (error: any) {
      console.error('识别失败:', error)
      Alert.alert('识别失败', error.message || '无法识别订单信息，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  // 确认并跳转到快速录入页面
  const handleConfirm = () => {
    if (!recognizedInfo) {
      Alert.alert('提示', '请先选择并识别订单截图')
      return
    }

    // 跳转到快速录入页面，传递识别的信息
    router.push({
      pathname: '/quick-checkin',
      params: {
        guestName: recognizedInfo.guestName || '',
        guestPhone: recognizedInfo.guestPhone || '',
        guestIdNumber: recognizedInfo.guestIdNumber || '',
        checkInDate: recognizedInfo.checkInDate || '',
        checkOutDate: recognizedInfo.checkOutDate || '',
        totalPrice: recognizedInfo.totalPrice?.toString() || '',
        platform: recognizedInfo.platform || '',
      },
    })
  }

  // 重新选择
  const handleReselect = () => {
    setSelectedImage(null)
    setRecognizedInfo(null)
    handlePickImage()
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      
      <View style={styles.container}>
        {/* 顶部标题栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>订单识别</Text>
          <View style={styles.headerRight} />
        </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 说明卡片 */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>📱 支持识别的平台</Text>
          <View style={styles.platformList}>
            <View style={styles.platformItem}>
              <Text style={styles.platformIcon}>🟡</Text>
              <Text style={styles.platformName}>美团民宿</Text>
            </View>
            <View style={styles.platformItem}>
              <Text style={styles.platformIcon}>🔵</Text>
              <Text style={styles.platformName}>途家</Text>
            </View>
            <View style={styles.platformItem}>
              <Text style={styles.platformIcon}>🟠</Text>
              <Text style={styles.platformName}>小猪短租</Text>
            </View>
          </View>
          <Text style={styles.instructionText}>
            请上传订单详情页的完整截图，系统将自动识别客人信息、入住时间、房费等信息
          </Text>
        </View>

        {/* 图片预览区域 */}
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <View style={styles.processingBox}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.processingText}>正在识别...</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage}>
            <Text style={styles.uploadIcon}>📸</Text>
            <Text style={styles.uploadText}>点击选择订单截图</Text>
            <Text style={styles.uploadHint}>支持从相册选择图片</Text>
          </TouchableOpacity>
        )}

        {/* 识别结果 */}
        {recognizedInfo && !isProcessing && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>识别结果</Text>
              {recognizedInfo.platform && (
                <View style={styles.platformBadge}>
                  <Text style={styles.platformBadgeText}>{recognizedInfo.platform}</Text>
                </View>
              )}
            </View>

            <View style={styles.resultContent}>
              {recognizedInfo.guestName && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>👤 姓名</Text>
                  <Text style={styles.resultValue}>{recognizedInfo.guestName}</Text>
                </View>
              )}

              {recognizedInfo.guestPhone && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>📞 电话</Text>
                  <Text style={styles.resultValue}>{recognizedInfo.guestPhone}</Text>
                </View>
              )}

              {recognizedInfo.guestIdNumber && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>🆔 身份证</Text>
                  <Text style={styles.resultValue}>{recognizedInfo.guestIdNumber}</Text>
                </View>
              )}

              {recognizedInfo.checkInDate && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>📅 入住</Text>
                  <Text style={styles.resultValue}>
                    {orderOcrService.formatDate(recognizedInfo.checkInDate)}
                  </Text>
                </View>
              )}

              {recognizedInfo.checkOutDate && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>📅 离店</Text>
                  <Text style={styles.resultValue}>
                    {orderOcrService.formatDate(recognizedInfo.checkOutDate)}
                  </Text>
                </View>
              )}

              {recognizedInfo.checkInDate && recognizedInfo.checkOutDate && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>🌙 天数</Text>
                  <Text style={styles.resultValue}>
                    {orderOcrService.calculateNights(
                      recognizedInfo.checkInDate,
                      recognizedInfo.checkOutDate
                    )}{' '}
                    晚
                  </Text>
                </View>
              )}

              {recognizedInfo.totalPrice && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>💰 房费</Text>
                  <Text style={[styles.resultValue, styles.priceValue]}>
                    ¥{recognizedInfo.totalPrice.toFixed(2)}
                  </Text>
                </View>
              )}

              {recognizedInfo.roomType && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>🏠 房型</Text>
                  <Text style={styles.resultValue}>{recognizedInfo.roomType}</Text>
                </View>
              )}

              {recognizedInfo.guestCount && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>👥 人数</Text>
                  <Text style={styles.resultValue}>{recognizedInfo.guestCount}人</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomBar}>
        {selectedImage && !isProcessing && (
          <>
            <TouchableOpacity style={styles.reselectButton} onPress={handleReselect}>
              <Text style={styles.reselectButtonText}>重新选择</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, !recognizedInfo && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!recognizedInfo}
            >
              <Text style={styles.confirmButtonText}>确认录入</Text>
            </TouchableOpacity>
          </>
        )}
        {!selectedImage && (
          <TouchableOpacity style={styles.selectButton} onPress={handlePickImage}>
            <Text style={styles.selectButtonText}>选择订单截图</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>
    </>
  )
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 12,
    backgroundColor: '#6366f1',
  },
  backButton: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  platformList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  platformItem: {
    alignItems: 'center',
  },
  platformIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  platformName: {
    fontSize: 12,
    color: '#666',
  },
  instructionText: {
    fontSize: 13,
    color: '#999',
    lineHeight: 20,
  },
  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    minHeight: 200,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 13,
    color: '#999',
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewImage: {
    width: '100%',
    height: 400,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  platformBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  resultContent: {
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  priceValue: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  selectButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reselectButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reselectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

