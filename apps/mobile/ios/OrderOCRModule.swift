import Foundation
import Vision
import UIKit
import React

// String扩展：左侧填充
extension String {
  func padLeft(toLength: Int, withPad character: String) -> String {
    let padCount = toLength - self.count
    if padCount <= 0 {
      return self
    }
    return String(repeating: character, count: padCount) + self
  }
}

@objc(OrderOCRModule)
class OrderOCRModule: NSObject {
  
  // MARK: - React Native Bridge
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  // MARK: - OCR Recognition
  
  @objc
  func recognizeOrderScreenshot(_ imageUri: String,
                                resolver: @escaping RCTPromiseResolveBlock,
                                rejecter: @escaping RCTPromiseRejectBlock) {
    
    guard let imageUrl = URL(string: imageUri) else {
      rejecter("INVALID_URI", "Invalid image URI", nil)
      return
    }
    
    // Load image
    var image: UIImage?
    
    if imageUri.hasPrefix("file://") {
      let path = imageUri.replacingOccurrences(of: "file://", with: "")
      image = UIImage(contentsOfFile: path)
    } else if imageUri.hasPrefix("data:image") {
      // Base64 encoded image
      if let base64String = imageUri.components(separatedBy: ",").last,
         let imageData = Data(base64Encoded: base64String) {
        image = UIImage(data: imageData)
      }
    } else {
      // Try to load from URL
      if let imageData = try? Data(contentsOf: imageUrl) {
        image = UIImage(data: imageData)
      }
    }
    
    guard let validImage = image, let cgImage = validImage.cgImage else {
      rejecter("INVALID_IMAGE", "Cannot load image", nil)
      return
    }
    
    // Preprocess image
    guard let processedImage = preprocessOrderImage(validImage),
          let processedCGImage = processedImage.cgImage else {
      rejecter("PREPROCESSING_FAILED", "Failed to preprocess image", nil)
      return
    }
    
    // Create text recognition request
    let request = VNRecognizeTextRequest { (request, error) in
      if let error = error {
        rejecter("OCR_FAILED", "OCR recognition failed: \(error.localizedDescription)", error)
        return
      }
      
      guard let observations = request.results as? [VNRecognizedTextObservation] else {
        rejecter("NO_TEXT", "No text found in image", nil)
        return
      }
      
      // Extract all recognized text
      var recognizedTexts: [(text: String, confidence: Float, bounds: CGRect)] = []
      for observation in observations {
        guard let topCandidate = observation.topCandidates(1).first else { continue }
        recognizedTexts.append((
          text: topCandidate.string,
          confidence: topCandidate.confidence,
          bounds: observation.boundingBox
        ))
      }
      
      // Parse order information
      let orderInfo = self.parseOrderInfo(from: recognizedTexts)
      
      resolver(orderInfo)
    }
    
    // Configure recognition options
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["zh-Hans", "zh-Hant", "en-US"]
    request.usesLanguageCorrection = true
    
    // Perform recognition
    let handler = VNImageRequestHandler(cgImage: processedCGImage, options: [:])
    
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try handler.perform([request])
      } catch {
        rejecter("OCR_ERROR", "Failed to perform OCR: \(error.localizedDescription)", error)
      }
    }
  }
  
  // MARK: - Image Preprocessing
  
  private func preprocessOrderImage(_ image: UIImage) -> UIImage? {
    guard let cgImage = image.cgImage else { return nil }
    
    let context = CIContext(options: nil)
    var ciImage = CIImage(cgImage: cgImage)
    
    // Adjust contrast and brightness
    if let colorControls = CIFilter(name: "CIColorControls") {
      colorControls.setValue(ciImage, forKey: kCIInputImageKey)
      colorControls.setValue(1.2, forKey: kCIInputContrastKey)
      colorControls.setValue(0.1, forKey: kCIInputBrightnessKey)
      if let output = colorControls.outputImage {
        ciImage = output
      }
    }
    
    // Sharpen
    if let sharpen = CIFilter(name: "CISharpenLuminance") {
      sharpen.setValue(ciImage, forKey: kCIInputImageKey)
      sharpen.setValue(0.6, forKey: kCIInputSharpnessKey)
      if let output = sharpen.outputImage {
        ciImage = output
      }
    }
    
    guard let outputCGImage = context.createCGImage(ciImage, from: ciImage.extent) else {
      return nil
    }
    
    return UIImage(cgImage: outputCGImage)
  }
  
  // MARK: - Order Information Parsing
  
  private func parseOrderInfo(from texts: [(text: String, confidence: Float, bounds: CGRect)]) -> [String: Any] {
    var result: [String: Any] = [:]
    
    // Sort texts by Y coordinate (top to bottom)
    let sortedTexts = texts.sorted { $0.bounds.origin.y > $1.bounds.origin.y }
    let fullText = sortedTexts.map { $0.text }.joined(separator: "\n")
    
    print("📱 识别的完整文本：\n\(fullText)")
    
    // Detect platform
    let platform = detectPlatform(from: fullText)
    result["platform"] = platform
    
    // Parse based on platform
    switch platform {
    case "美团":
      result = parseMeituanOrder(from: sortedTexts, fullText: fullText)
    case "途家":
      result = parseTujiaOrder(from: sortedTexts, fullText: fullText)
    case "小猪":
      result = parseXiaozhuOrder(from: sortedTexts, fullText: fullText)
    default:
      result = parseGenericOrder(from: sortedTexts, fullText: fullText)
    }
    
    result["platform"] = platform
    result["rawText"] = fullText
    
    return result
  }
  
  // MARK: - Platform Detection
  
  private func detectPlatform(from text: String) -> String {
    if text.contains("美团") || text.contains("meituan") {
      return "美团"
    } else if text.contains("途家") || text.contains("tujia") {
      return "途家"
    } else if text.contains("小猪") || text.contains("xiaozhu") || (text.contains("订单号") && text.contains("飞猪")) {
      return "小猪"
    }
    return "未知"
  }
  
  // MARK: - Platform-Specific Parsers
  
  private func parseMeituanOrder(from texts: [(text: String, confidence: Float, bounds: CGRect)], fullText: String) -> [String: Any] {
    var result: [String: Any] = [:]
    
    // Extract guest name - 改进：支持更多格式
    let namePatterns = [
      // 预订人/入住人后面跟姓名
      "(?:预订人|入住人)[：:\\s]*([\\u4e00-\\u9fa5]{2,4})",
      // 姓名后面跟"等X人"（如：王焕甲等3人）
      "([\\u4e00-\\u9fa5]{2,4})等\\d+人",
      // 电话标签后面的姓名（如：电话 王焕甲等3人）
      "电话[：:\\s]*([\\u4e00-\\u9fa5]{2,4})",
    ]
    
    for pattern in namePatterns {
      if let nameMatch = fullText.range(of: pattern, options: .regularExpression) {
        let nameText = String(fullText[nameMatch])
        // 提取纯中文姓名
        if let nameRange = nameText.range(of: "[\\u4e00-\\u9fa5]{2,4}", options: .regularExpression) {
          let extractedName = String(nameText[nameRange])
          // 排除关键词
          let excludeWords = ["预订人", "入住人", "电话"]
          if !excludeWords.contains(extractedName) {
            result["guestName"] = extractedName
            print("✅ [美团] 提取到姓名: \(extractedName)")
            break
          }
        }
      }
    }
    
    // Extract phone number
    if let phoneMatch = fullText.range(of: "(?:联系电话|手机号|电话)[：:]*\\s*(1[3-9]\\d{9})", options: .regularExpression) {
      let phoneText = String(fullText[phoneMatch])
      if let phone = phoneText.components(separatedBy: CharacterSet(charactersIn: "：: \n")).last?.trimmingCharacters(in: .whitespaces) {
        result["guestPhone"] = phone
      }
    }
    
    // Extract check-in and check-out dates
    // 格式1: 2025.12.05-2025.12.14
    if let dateRange = fullText.range(of: "(\\d{4})[.年](\\d{1,2})[.月](\\d{1,2})日?\\s*[-–—至到]\\s*(\\d{4})[.年](\\d{1,2})[.月](\\d{1,2})日?", options: .regularExpression) {
      let dateText = String(fullText[dateRange])
      let dates = dateText.components(separatedBy: CharacterSet(charactersIn: "-–—至到"))
      if dates.count == 2 {
        // 统一转换为 YYYY年MM月DD日 格式
        var checkIn = dates[0].trimmingCharacters(in: .whitespaces)
        var checkOut = dates[1].trimmingCharacters(in: .whitespaces)
        checkIn = checkIn.replacingOccurrences(of: ".", with: "年", options: [], range: checkIn.startIndex..<checkIn.index(checkIn.startIndex, offsetBy: min(4, checkIn.count)))
        checkIn = checkIn.replacingOccurrences(of: ".", with: "月")
        if !checkIn.hasSuffix("日") { checkIn += "日" }
        checkOut = checkOut.replacingOccurrences(of: ".", with: "年", options: [], range: checkOut.startIndex..<checkOut.index(checkOut.startIndex, offsetBy: min(4, checkOut.count)))
        checkOut = checkOut.replacingOccurrences(of: ".", with: "月")
        if !checkOut.hasSuffix("日") { checkOut += "日" }
        result["checkInDate"] = checkIn
        result["checkOutDate"] = checkOut
      }
    }
    // 格式2: 12月01日-12月03日
    else if let dateRange = fullText.range(of: "(\\d{1,2}月\\d{1,2}日)\\s*[-–—]\\s*(\\d{1,2}月\\d{1,2}日)", options: .regularExpression) {
      let dateText = String(fullText[dateRange])
      let dates = dateText.components(separatedBy: CharacterSet(charactersIn: "-–—"))
      if dates.count == 2 {
        let currentYear = Calendar.current.component(.year, from: Date())
        result["checkInDate"] = "\(currentYear)年" + dates[0].trimmingCharacters(in: .whitespaces)
        result["checkOutDate"] = "\(currentYear)年" + dates[1].trimmingCharacters(in: .whitespaces)
      }
    }
    
    // Extract price
    if let priceMatch = fullText.range(of: "(?:预计收入|总价|房费|实付)[：:]*\\s*[¥￥]?\\s*(\\d+\\.?\\d*)", options: .regularExpression) {
      let priceText = String(fullText[priceMatch])
      if let priceStr = priceText.components(separatedBy: CharacterSet(charactersIn: "：:¥￥ \n")).last?.trimmingCharacters(in: .whitespaces),
         let price = Double(priceStr) {
        result["totalPrice"] = price
      }
    }
    
    // Extract room type
    if let roomMatch = fullText.range(of: "([\\u4e00-\\u9fa5]{2,10}房|[\\u4e00-\\u9fa5]{2,10}室)", options: .regularExpression) {
      let roomText = String(fullText[roomMatch])
      result["roomType"] = roomText
    }
    
    // Extract guest count
    if let guestCountMatch = fullText.range(of: "(\\d+)位入住人", options: .regularExpression) {
      let countText = String(fullText[guestCountMatch])
      if let countStr = countText.components(separatedBy: CharacterSet.decimalDigits.inverted).joined().first,
         let count = Int(String(countStr)) {
        result["guestCount"] = count
      }
    }
    
    return result
  }
  
  private func parseTujiaOrder(from texts: [(text: String, confidence: Float, bounds: CGRect)], fullText: String) -> [String: Any] {
    var result: [String: Any] = [:]
    
    // Extract guest name - 改进：支持更多格式
    let namePatterns = [
      // 房客姓名后面跟姓名
      "房客姓名[：:\\s]*([\\u4e00-\\u9fa5]{2,4})",
      // 姓名后面跟渠道信息（如：宋同贵 去哪儿）
      "([\\u4e00-\\u9fa5]{2,4})\\s+(?:去哪儿|携程|飞猪|美团|途家|钻石会员|黄金会员)",
      // 姓名后面跟先生/女士
      "([\\u4e00-\\u9fa5]{2,4})\\s+(?:先生|女士)",
      // 单独的姓名标签
      "姓名[：:\\s]*([\\u4e00-\\u9fa5]{2,4})",
    ]
    
    for pattern in namePatterns {
      if let nameMatch = fullText.range(of: pattern, options: .regularExpression) {
        let nameText = String(fullText[nameMatch])
        // 提取纯中文姓名（2-4个字）
        if let nameRange = nameText.range(of: "[\\u4e00-\\u9fa5]{2,4}", options: .regularExpression) {
          let extractedName = String(nameText[nameRange])
          // 排除关键词
          let excludeWords = ["房客姓名", "姓名", "先生", "女士", "去哪儿", "携程", "飞猪", "美团", "途家", "钻石", "黄金", "会员"]
          if !excludeWords.contains(extractedName) {
            result["guestName"] = extractedName
            print("✅ 提取到姓名: \(extractedName)")
            break
          }
        }
      }
    }
    
    // Extract ID number - 改进：支持带星号的格式
    let idPatterns = [
      // 完整身份证号
      "身份信息[：:\\s]*(\\d{15}|\\d{17}[0-9Xx])",
      // 带星号的身份证号（如：37232519********10）
      "身份信息[：:\\s]*(\\d{8}\\*{8}\\d{2})",
      // 单独的身份证号
      "(\\d{15}|\\d{17}[0-9Xx])",
      // 带星号的单独身份证号
      "(\\d{6,8}\\*{6,8}\\d{2,4})"
    ]
    
    for pattern in idPatterns {
      if let idMatch = fullText.range(of: pattern, options: .regularExpression) {
        let idText = String(fullText[idMatch])
        // 提取身份证号部分（包括带星号的）
        if let idRange = idText.range(of: "\\d{15}|\\d{17}[0-9Xx]|\\d{6,8}\\*{6,8}\\d{2,4}", options: .regularExpression) {
          let idNumber = String(idText[idRange])
          result["guestIdNumber"] = idNumber
          print("✅ 提取到身份证: \(idNumber)")
          break
        }
      }
    }
    
    // Extract phone number - 改进：支持带星号的格式
    let phonePatterns = [
      // 完整手机号
      "联系电话[：:\\s]*(1[3-9]\\d{9})",
      // 带星号的手机号（如：139****6364）
      "联系电话[：:\\s]*(\\d{3}\\*{4}\\d{4})",
      // 单独的手机号
      "(1[3-9]\\d{9})",
      // 带星号的单独手机号
      "(\\d{3}\\*{4}\\d{4})"
    ]
    
    for pattern in phonePatterns {
      if let phoneMatch = fullText.range(of: pattern, options: .regularExpression) {
        let phoneText = String(fullText[phoneMatch])
        // 提取电话号码部分
        if let phoneRange = phoneText.range(of: "1[3-9]\\d{9}|\\d{3}\\*{4}\\d{4}", options: .regularExpression) {
          let phone = String(phoneText[phoneRange])
          result["guestPhone"] = phone
          print("✅ 提取到电话: \(phone)")
          break
        }
      }
    }
    
    // Extract dates - 改进：支持更多日期格式
    var datesFound = false
    
    // 尝试匹配完整日期格式：2025.12.05-2025.12.14
    if let dateRange = fullText.range(of: "(\\d{4})[.年](\\d{1,2})[.月](\\d{1,2})日?\\s*[-–—至]\\s*(\\d{4})[.年](\\d{1,2})[.月](\\d{1,2})日?", options: .regularExpression) {
      let dateText = String(fullText[dateRange])
      let dates = dateText.components(separatedBy: CharacterSet(charactersIn: "-–—至"))
      if dates.count == 2 {
        var checkIn = dates[0].trimmingCharacters(in: .whitespaces)
        var checkOut = dates[1].trimmingCharacters(in: .whitespaces)
        // 统一格式
        checkIn = checkIn.replacingOccurrences(of: ".", with: "年", options: [], range: checkIn.startIndex..<checkIn.index(checkIn.startIndex, offsetBy: min(4, checkIn.count)))
        checkIn = checkIn.replacingOccurrences(of: ".", with: "月")
        if !checkIn.hasSuffix("日") { checkIn += "日" }
        checkOut = checkOut.replacingOccurrences(of: ".", with: "年", options: [], range: checkOut.startIndex..<checkOut.index(checkOut.startIndex, offsetBy: min(4, checkOut.count)))
        checkOut = checkOut.replacingOccurrences(of: ".", with: "月")
        if !checkOut.hasSuffix("日") { checkOut += "日" }
        result["checkInDate"] = checkIn
        result["checkOutDate"] = checkOut
        datesFound = true
        print("✅ 提取到日期: \(checkIn) - \(checkOut)")
      }
    }
    
    // 尝试匹配月日格式：12月01日周一 ... 12月03日周三
    if !datesFound {
      // 使用更宽松的匹配，允许中间有其他文字
      let pattern = "(\\d{1,2}月\\d{1,2}日)(?:周[一二三四五六日])?[\\s\\S]{0,100}?(\\d{1,2}月\\d{1,2}日)(?:周[一二三四五六日])?"
      if let dateMatch = fullText.range(of: pattern, options: .regularExpression) {
        let dateText = String(fullText[dateMatch])
        // 提取所有的"月日"格式
        let datePattern = "\\d{1,2}月\\d{1,2}日"
        var dates: [String] = []
        var searchRange = dateText.startIndex..<dateText.endIndex
        while let range = dateText.range(of: datePattern, options: .regularExpression, range: searchRange) {
          dates.append(String(dateText[range]))
          searchRange = range.upperBound..<dateText.endIndex
        }
        
        if dates.count >= 2 {
          let currentYear = Calendar.current.component(.year, from: Date())
          result["checkInDate"] = "\(currentYear)年" + dates[0]
          result["checkOutDate"] = "\(currentYear)年" + dates[1]
          datesFound = true
          print("✅ 提取到日期: \(currentYear)年\(dates[0]) - \(currentYear)年\(dates[1])")
        }
      }
    }
    
    // Extract price
    if let rentMatch = fullText.range(of: "房租[：:]*\\s*[¥￥]?\\s*(\\d+\\.?\\d*)", options: .regularExpression) {
      let rentText = String(fullText[rentMatch])
      if let priceStr = rentText.components(separatedBy: CharacterSet(charactersIn: "：:¥￥ \n")).last?.trimmingCharacters(in: .whitespaces),
         let price = Double(priceStr) {
        result["totalPrice"] = price
      }
    }
    
    // Extract room type
    if let roomMatch = fullText.range(of: "房型套餐[：:]*\\s*([^\\n]{5,30})", options: .regularExpression) {
      let roomText = String(fullText[roomMatch])
      if let room = roomText.components(separatedBy: CharacterSet(charactersIn: "：:\n")).last?.trimmingCharacters(in: .whitespaces) {
        result["roomType"] = room
      }
    }
    
    return result
  }
  
  private func parseXiaozhuOrder(from texts: [(text: String, confidence: Float, bounds: CGRect)], fullText: String) -> [String: Any] {
    var result: [String: Any] = [:]
    
    // Extract guest name
    let namePatterns = [
      "预订人[：:\\s]*([\\u4e00-\\u9fa5]{2,4})",
      "([\\u4e00-\\u9fa5]{2,4})\\s+(?:复制|小猪订单号)",
    ]
    
    for pattern in namePatterns {
      if let nameMatch = fullText.range(of: pattern, options: .regularExpression) {
        let nameText = String(fullText[nameMatch])
        if let nameRange = nameText.range(of: "[\\u4e00-\\u9fa5]{2,4}", options: .regularExpression) {
          let extractedName = String(nameText[nameRange])
          let excludeWords = ["预订人", "复制", "小猪", "订单号"]
          if !excludeWords.contains(extractedName) {
            result["guestName"] = extractedName
            print("✅ [小猪] 提取到姓名: \(extractedName)")
            break
          }
        }
      }
    }
    
    // Extract dates - 改进：统一格式为 YYYY年MM月DD日
    if let dateMatch = fullText.range(of: "(\\d{1,2})[.](\\d{1,2})\\s*[-–—]\\s*(\\d{1,2})[.](\\d{1,2})", options: .regularExpression) {
      let dateText = String(fullText[dateMatch])
      let dates = dateText.components(separatedBy: CharacterSet(charactersIn: "-–—"))
      if dates.count == 2 {
        let currentYear = Calendar.current.component(.year, from: Date())
        let checkInParts = dates[0].trimmingCharacters(in: .whitespaces).split(separator: ".")
        let checkOutParts = dates[1].trimmingCharacters(in: .whitespaces).split(separator: ".")
        
        if checkInParts.count == 2 && checkOutParts.count == 2 {
          let checkInMonth = String(checkInParts[0]).padLeft(toLength: 2, withPad: "0")
          let checkInDay = String(checkInParts[1]).padLeft(toLength: 2, withPad: "0")
          let checkOutMonth = String(checkOutParts[0]).padLeft(toLength: 2, withPad: "0")
          let checkOutDay = String(checkOutParts[1]).padLeft(toLength: 2, withPad: "0")
          
          result["checkInDate"] = "\(currentYear)年\(checkInMonth)月\(checkInDay)日"
          result["checkOutDate"] = "\(currentYear)年\(checkOutMonth)月\(checkOutDay)日"
          print("✅ [小猪] 提取到日期: \(currentYear)年\(checkInMonth)月\(checkInDay)日 - \(currentYear)年\(checkOutMonth)月\(checkOutDay)日")
        }
      }
    }
    
    // Extract price
    if let priceMatch = fullText.range(of: "本单预计收入[：:]*\\s*[¥￥]?\\s*(\\d+\\.?\\d*)", options: .regularExpression) {
      let priceText = String(fullText[priceMatch])
      if let priceStr = priceText.components(separatedBy: CharacterSet(charactersIn: "：:¥￥ \n")).last?.trimmingCharacters(in: .whitespaces),
         let price = Double(priceStr) {
        result["totalPrice"] = price
      }
    }
    
    // Extract address
    if let addressMatch = fullText.range(of: "海南[,，].*?\\d+号", options: .regularExpression) {
      let address = String(fullText[addressMatch])
      result["address"] = address
    }
    
    return result
  }
  
  private func parseGenericOrder(from texts: [(text: String, confidence: Float, bounds: CGRect)], fullText: String) -> [String: Any] {
    var result: [String: Any] = [:]
    
    // Generic name extraction - 改进：更智能的姓名提取
    let namePatterns = [
      "(?:姓名|预订人|入住人|房客姓名|联系人)[：:]*\\s*([\\u4e00-\\u9fa5]{2,4})",
      "([\\u4e00-\\u9fa5]{2,4})\\s+(?:先生|女士|小姐)"
    ]
    for pattern in namePatterns {
      if let match = fullText.range(of: pattern, options: .regularExpression) {
        let text = String(fullText[match])
        // 提取纯中文姓名
        if let nameRange = text.range(of: "[\\u4e00-\\u9fa5]{2,4}", options: .regularExpression) {
          let extractedName = String(text[nameRange])
          // 排除关键词
          let excludeWords = ["姓名", "预订人", "入住人", "房客", "联系人", "先生", "女士", "小姐"]
          if !excludeWords.contains(extractedName) {
            result["guestName"] = extractedName
            break
          }
        }
      }
    }
    
    // Generic phone extraction
    if let phoneMatch = fullText.range(of: "1[3-9]\\d{9}", options: .regularExpression) {
      result["guestPhone"] = String(fullText[phoneMatch])
    }
    
    // Generic date extraction - 改进：支持更多日期格式
    let datePatterns = [
      // 完整年月日：2025.12.05-2025.12.14
      "(\\d{4})[.年/-](\\d{1,2})[.月/-](\\d{1,2})日?\\s*[-–—至到]\\s*(\\d{4})[.年/-](\\d{1,2})[.月/-](\\d{1,2})日?",
      // 月日格式：12月01日-12月03日
      "(\\d{1,2}月\\d{1,2}日)\\s*[-–—至到]\\s*(\\d{1,2}月\\d{1,2}日)",
      // 点分格式：12.01-12.03
      "(\\d{1,2})[.](\\d{1,2})\\s*[-–—]\\s*(\\d{1,2})[.](\\d{1,2})"
    ]
    
    for (index, pattern) in datePatterns.enumerated() {
      if let match = fullText.range(of: pattern, options: .regularExpression) {
        let dateText = String(fullText[match])
        
        if index == 0 {
          // 完整年月日格式
          let dates = dateText.components(separatedBy: CharacterSet(charactersIn: "-–—至到"))
          if dates.count == 2 {
            var checkIn = dates[0].trimmingCharacters(in: .whitespaces)
            var checkOut = dates[1].trimmingCharacters(in: .whitespaces)
            
            // 统一格式为：YYYY年MM月DD日
            // 先替换第一个分隔符为"年"
            if let firstSepRange = checkIn.rangeOfCharacter(from: CharacterSet(charactersIn: "./- ")) {
              checkIn.replaceSubrange(firstSepRange, with: "年")
            }
            // 再替换第二个分隔符为"月"
            if let secondSepRange = checkIn.rangeOfCharacter(from: CharacterSet(charactersIn: "./- ")) {
              checkIn.replaceSubrange(secondSepRange, with: "月")
            }
            if !checkIn.hasSuffix("日") { checkIn += "日" }
            
            // 同样处理离店日期
            if let firstSepRange = checkOut.rangeOfCharacter(from: CharacterSet(charactersIn: "./- ")) {
              checkOut.replaceSubrange(firstSepRange, with: "年")
            }
            if let secondSepRange = checkOut.rangeOfCharacter(from: CharacterSet(charactersIn: "./- ")) {
              checkOut.replaceSubrange(secondSepRange, with: "月")
            }
            if !checkOut.hasSuffix("日") { checkOut += "日" }
            
            result["checkInDate"] = checkIn
            result["checkOutDate"] = checkOut
            break
          }
        } else if index == 1 {
          // 月日格式
          let dates = dateText.components(separatedBy: CharacterSet(charactersIn: "-–—至到"))
          if dates.count == 2 {
            let currentYear = Calendar.current.component(.year, from: Date())
            result["checkInDate"] = "\(currentYear)年" + dates[0].trimmingCharacters(in: .whitespaces)
            result["checkOutDate"] = "\(currentYear)年" + dates[1].trimmingCharacters(in: .whitespaces)
            break
          }
        } else if index == 2 {
          // 点分格式：12.01-12.05
          let dates = dateText.components(separatedBy: CharacterSet(charactersIn: "-–—"))
          if dates.count == 2 {
            let currentYear = Calendar.current.component(.year, from: Date())
            let checkInParts = dates[0].trimmingCharacters(in: .whitespaces).split(separator: ".")
            let checkOutParts = dates[1].trimmingCharacters(in: .whitespaces).split(separator: ".")
            
            if checkInParts.count == 2 && checkOutParts.count == 2 {
              let checkInMonth = String(checkInParts[0]).padLeft(toLength: 2, withPad: "0")
              let checkInDay = String(checkInParts[1]).padLeft(toLength: 2, withPad: "0")
              let checkOutMonth = String(checkOutParts[0]).padLeft(toLength: 2, withPad: "0")
              let checkOutDay = String(checkOutParts[1]).padLeft(toLength: 2, withPad: "0")
              
              result["checkInDate"] = "\(currentYear)年\(checkInMonth)月\(checkInDay)日"
              result["checkOutDate"] = "\(currentYear)年\(checkOutMonth)月\(checkOutDay)日"
              break
            }
          }
        }
      }
    }
    
    // Generic price extraction
    if let priceMatch = fullText.range(of: "[¥￥]\\s*(\\d+\\.?\\d*)", options: .regularExpression) {
      let priceText = String(fullText[priceMatch])
      if let priceStr = priceText.components(separatedBy: CharacterSet(charactersIn: "¥￥ ")).last,
         let price = Double(priceStr) {
        result["totalPrice"] = price
      }
    }
    
    return result
  }
}
