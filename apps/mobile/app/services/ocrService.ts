import { NativeModules, Platform } from 'react-native'

const { IDCardOCRModule } = NativeModules

export interface IDCardInfo {
  name?: string
  gender?: string
  nationality?: string
  birthDate?: string
  birthYear?: string
  birthMonth?: string
  birthDay?: string
  address?: string
  idNumber?: string
  rawTexts?: string[]
  fullText?: string
}

class OCRService {
  /**
   * 识别身份证信息
   * @param imageUri 图片URI (file://, data:image, 或 http://)
   * @returns 身份证信息
   */
  async recognizeIDCard(imageUri: string): Promise<IDCardInfo> {
    if (Platform.OS !== 'ios') {
      throw new Error('OCR is only supported on iOS')
    }

    if (!IDCardOCRModule) {
      throw new Error('IDCardOCRModule is not available')
    }

    try {
      console.log('🔍 [OCR] 开始识别身份证:', imageUri.substring(0, 50))
      const result = await IDCardOCRModule.recognizeIDCard(imageUri)
      console.log('✅ [OCR] 识别成功:', result)
      return result
    } catch (error) {
      console.error('❌ [OCR] 识别失败:', error)
      throw error
    }
  }

  /**
   * 预处理图片以提高识别率
   * @param imageUri 图片URI
   * @returns 处理后的图片URI
   */
  async preprocessImage(imageUri: string): Promise<string> {
    if (Platform.OS !== 'ios') {
      return imageUri
    }

    if (!IDCardOCRModule) {
      return imageUri
    }

    try {
      console.log('🖼️ [OCR] 预处理图片:', imageUri.substring(0, 50))
      const result = await IDCardOCRModule.preprocessImage(imageUri)
      console.log('✅ [OCR] 预处理完成')
      return result.uri
    } catch (error) {
      console.error('❌ [OCR] 预处理失败:', error)
      return imageUri
    }
  }

  /**
   * 验证身份证号码格式
   */
  validateIDNumber(idNumber: string): boolean {
    if (!idNumber || idNumber.length !== 18) {
      return false
    }

    // 验证前17位是否为数字
    const first17 = idNumber.substring(0, 17)
    if (!/^\d{17}$/.test(first17)) {
      return false
    }

    // 验证最后一位（可以是数字或X）
    const last = idNumber.substring(17, 18)
    if (!/^[0-9Xx]$/.test(last)) {
      return false
    }

    // 验证校验码
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += parseInt(first17.charAt(i)) * weights[i]
    }

    const checkCode = checkCodes[sum % 11]
    return checkCode === last.toUpperCase()
  }

  /**
   * 从身份证号码提取信息
   */
  extractInfoFromIDNumber(idNumber: string): Partial<IDCardInfo> {
    if (!this.validateIDNumber(idNumber)) {
      return {}
    }

    const year = idNumber.substring(6, 10)
    const month = idNumber.substring(10, 12)
    const day = idNumber.substring(12, 14)
    const genderCode = parseInt(idNumber.substring(16, 17))

    return {
      birthYear: year,
      birthMonth: month,
      birthDay: day,
      birthDate: `${year}年${month}月${day}日`,
      gender: genderCode % 2 === 0 ? '女' : '男',
    }
  }

  /**
   * 格式化身份证信息用于显示
   */
  formatIDCardInfo(info: IDCardInfo): string {
    const parts: string[] = []

    if (info.name) parts.push(`姓名: ${info.name}`)
    if (info.gender) parts.push(`性别: ${info.gender}`)
    if (info.nationality) parts.push(`民族: ${info.nationality}`)
    if (info.birthDate) parts.push(`出生: ${info.birthDate}`)
    if (info.address) parts.push(`住址: ${info.address}`)
    if (info.idNumber) parts.push(`身份证号: ${info.idNumber}`)

    return parts.join('\n')
  }

  /**
   * 清理识别结果中的噪音
   */
  cleanRecognizedText(text: string): string {
    return text
      .replace(/\s+/g, '') // 移除空格
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '') // 只保留中文、英文和数字
      .trim()
  }

  /**
   * 智能匹配姓名
   * 中国姓名通常是2-4个汉字
   */
  extractName(texts: string[]): string | undefined {
    const namePattern = /^[\u4e00-\u9fa5]{2,4}$/
    
    for (const text of texts) {
      const cleaned = this.cleanRecognizedText(text)
      if (namePattern.test(cleaned) && !['姓名', '性别', '民族', '出生', '住址'].includes(cleaned)) {
        return cleaned
      }
    }

    return undefined
  }

  /**
   * 提取身份证号码
   */
  extractIDNumber(texts: string[]): string | undefined {
    const idPattern = /[0-9]{17}[0-9Xx]/
    
    for (const text of texts) {
      const match = text.match(idPattern)
      if (match && this.validateIDNumber(match[0])) {
        return match[0]
      }
    }

    return undefined
  }
}

export const ocrService = new OCRService()



