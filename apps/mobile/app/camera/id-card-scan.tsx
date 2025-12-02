import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native'
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera'
import { useRouter } from 'expo-router'
import { Stack } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { IDCardOverlay } from '../components/IDCardOverlay'
import { ocrService, IDCardInfo } from '../services/ocrService'

const { width, height } = Dimensions.get('window')

export default function IDCardScanScreen() {
  const router = useRouter()
  const cameraRef = useRef<any>(null)
  
  const [permission, requestPermission] = useCameraPermissions()
  const [isProcessing, setIsProcessing] = useState(false)
  const [flashMode, setFlashMode] = useState<FlashMode>('off')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  // 请求相机权限
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission()
    }
  }, [permission])

  // 拍照并识别
  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return

    try {
      setIsProcessing(true)

      console.log('📸 [IDCardScan] 开始拍照...')
      
      // 拍照
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        exif: false,
      })

      console.log('📸 [IDCardScan] 拍照完成:', photo.uri)
      setCapturedImage(photo.uri)

      // 预处理图片（提高识别率）
      let imageUri = photo.uri
      try {
        console.log('🖼️ [IDCardScan] 开始预处理图片...')
        imageUri = await ocrService.preprocessImage(photo.uri)
        console.log('✅ [IDCardScan] 图片预处理完成')
      } catch (error) {
        console.warn('⚠️ [IDCardScan] 图片预处理失败，使用原图:', error)
      }

      // OCR识别
      console.log('🔍 [IDCardScan] 开始OCR识别...')
      const idCardInfo = await ocrService.recognizeIDCard(imageUri)
      
      console.log('✅ [IDCardScan] OCR识别完成:', idCardInfo)

      // 验证识别结果
      if (!idCardInfo.name && !idCardInfo.idNumber) {
        Alert.alert(
          '识别失败',
          '未能识别到身份证信息，请重新拍摄\n\n提示：\n• 确保光线充足\n• 身份证放入框内\n• 避免反光和模糊',
          [
            { text: '重新拍摄', onPress: () => setIsProcessing(false) },
          ]
        )
        setCapturedImage(null)
        return
      }

      // 显示识别结果
      showRecognitionResult(idCardInfo)
    } catch (error: any) {
      console.error('❌ [IDCardScan] 识别失败:', error)
      
      Alert.alert(
        '识别失败',
        error.message || '未能识别身份证，请重试',
        [
          { text: '重新拍摄', onPress: () => setIsProcessing(false) },
        ]
      )
      setCapturedImage(null)
    } finally {
      // 不在这里设置 setIsProcessing(false)，等用户选择后再处理
    }
  }

  // 切换闪光灯
  const toggleFlash = () => {
    setFlashMode(prev => {
      const newMode = prev === 'off' ? 'torch' : 'off'
      console.log('💡 [IDCardScan] 切换闪光灯:', prev, '→', newMode)
      return newMode
    })
  }

  // 显示识别结果
  const showRecognitionResult = (idCardInfo: IDCardInfo) => {
    // 构建显示信息
    const displayInfo = []
    if (idCardInfo.name) displayInfo.push(`姓名：${idCardInfo.name}`)
    if (idCardInfo.gender) displayInfo.push(`性别：${idCardInfo.gender}`)
    if (idCardInfo.nationality) displayInfo.push(`民族：${idCardInfo.nationality}`)
    if (idCardInfo.birthDate) displayInfo.push(`出生：${idCardInfo.birthDate}`)
    if (idCardInfo.idNumber) displayInfo.push(`身份证号：${idCardInfo.idNumber}`)
    if (idCardInfo.address) displayInfo.push(`住址：${idCardInfo.address}`)
    
    const infoText = displayInfo.join('\n')
    
    Alert.alert(
      '✅ 识别成功',
      `请确认以下信息：\n\n${infoText}`,
      [
        {
          text: '重新识别',
          style: 'cancel',
          onPress: () => {
            setIsProcessing(false)
            setCapturedImage(null)
          },
        },
        {
          text: '确认无误',
          onPress: () => {
            // 跳转到快速录入页面
            router.replace({
              pathname: '/quick-checkin',
              params: {
                name: idCardInfo.name || '',
                idNumber: idCardInfo.idNumber || '',
                gender: idCardInfo.gender || '',
                nationality: idCardInfo.nationality || '',
                birthDate: idCardInfo.birthDate || '',
                address: idCardInfo.address || '',
              },
            })
          },
        },
      ]
    )
  }

  // 从相册选择图片
  const handlePickImage = async () => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能选择图片')
        return
      }

      // 打开相册
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      })

      if (result.canceled) {
        return
      }

      // 处理选中的图片
      setIsProcessing(true)
      const imageUri = result.assets[0].uri
      
      console.log('📷 [IDCardScan] 从相册选择图片:', imageUri)

      // 预处理图片
      let processedUri = imageUri
      try {
        console.log('🖼️ [IDCardScan] 开始预处理图片...')
        processedUri = await ocrService.preprocessImage(imageUri)
        console.log('✅ [IDCardScan] 图片预处理完成')
      } catch (error) {
        console.warn('⚠️ [IDCardScan] 图片预处理失败，使用原图:', error)
      }

      // OCR识别
      console.log('🔍 [IDCardScan] 开始OCR识别...')
      const idCardInfo = await ocrService.recognizeIDCard(processedUri)
      
      console.log('✅ [IDCardScan] OCR识别完成:', idCardInfo)

      // 验证识别结果
      if (!idCardInfo.name && !idCardInfo.idNumber) {
        Alert.alert(
          '识别失败',
          '未能识别到身份证信息，请选择清晰的身份证照片',
          [
            { text: '重新选择', onPress: () => setIsProcessing(false) },
          ]
        )
        return
      }

      // 显示识别结果
      showRecognitionResult(idCardInfo)
    } catch (error: any) {
      console.error('❌ [IDCardScan] 相册选择失败:', error)
      Alert.alert('错误', error.message || '选择图片失败')
      setIsProcessing(false)
    }
  }

  // 如果没有权限
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>需要相机权限</Text>
          <Text style={styles.permissionText}>
            为了扫描身份证，需要访问您的相机
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>授予权限</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <>
      {/* 隐藏导航栏 */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      
      <View style={styles.container}>
        {/* 相机视图 */}
        <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashMode}
        enableTorch={flashMode === 'torch'}
      >
        {/* 身份证掩膜引导 */}
        <IDCardOverlay showGuide={!isProcessing} />

        {/* 顶部关闭按钮 - 磨砂质感 */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.topButtonInner}>
              <Text style={styles.topButtonText}>✕</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 底部操作栏 - 磨砂质感 */}
        <View style={styles.bottomContainer}>
          <View style={styles.bottomBar}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.processingText}>识别中...</Text>
              </View>
            ) : (
              <>
                {/* 相册按钮 */}
                <TouchableOpacity
                  style={styles.sideButton}
                  onPress={handlePickImage}
                  disabled={isProcessing}
                  activeOpacity={0.7}
                >
                  <View style={styles.sideButtonInner}>
                    <View style={styles.albumIconContainer}>
                      <View style={styles.albumIconTop} />
                      <View style={styles.albumIconBottom} />
                    </View>
                  </View>
                  <Text style={styles.sideButtonLabel}>相册</Text>
                </TouchableOpacity>
                
                {/* 拍照按钮 */}
                <TouchableOpacity
                  style={styles.captureButtonContainer}
                  onPress={handleCapture}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <View style={styles.captureButton}>
                    <View style={styles.captureButtonInner} />
                  </View>
                </TouchableOpacity>

                {/* 闪光灯按钮 */}
                <TouchableOpacity
                  style={styles.sideButton}
                  onPress={toggleFlash}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sideButtonInner, flashMode === 'torch' && styles.flashActiveSide]}>
                    <Text style={[styles.sideButtonIcon, flashMode === 'torch' && styles.flashActiveIcon]}>
                      {flashMode === 'torch' ? '⚡' : '⚡'}
                    </Text>
                  </View>
                  <Text style={styles.sideButtonLabel}>
                    {flashMode === 'torch' ? '关闭' : '闪光灯'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </CameraView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  topButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  topButtonInner: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(20px)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  topButtonText: {
    fontSize: 26,
    color: 'white',
    fontWeight: '300',
  },
  flashActiveButton: {
    // 容器样式
  },
  flashActiveInner: {
    backgroundColor: 'rgba(255, 193, 7, 0.6)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  flashActiveText: {
    color: '#FFF',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(30px)',
  },
  sideButton: {
    alignItems: 'center',
    width: 70,
  },
  sideButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  sideButtonIcon: {
    fontSize: 28,
    color: 'white',
  },
  sideButtonLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  flashActiveSide: {
    backgroundColor: 'rgba(255, 193, 7, 0.4)',
    borderColor: 'rgba(255, 193, 7, 0.5)',
  },
  flashActiveIcon: {
    color: '#FFC107',
  },
  captureButtonContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(20px)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#6366f1',
  },
  albumIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumIconTop: {
    position: 'absolute',
    top: 8,
    left: 4,
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  albumIconBottom: {
    position: 'absolute',
    bottom: 8,
    right: 4,
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
})

