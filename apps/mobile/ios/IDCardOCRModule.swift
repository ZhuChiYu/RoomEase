import Foundation
import Vision
import UIKit
import React

@objc(IDCardOCRModule)
class IDCardOCRModule: NSObject {
  
  // MARK: - React Native Bridge
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  // MARK: - OCR Recognition
  
  @objc
  func recognizeIDCard(_ imageUri: String,
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
    
    // Perform OCR
    performTextRecognition(on: cgImage) { result in
      switch result {
      case .success(let idCardInfo):
        resolver(idCardInfo)
      case .failure(let error):
        rejecter("OCR_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  // MARK: - Vision Text Recognition
  
  private func performTextRecognition(on cgImage: CGImage,
                                     completion: @escaping (Result<[String: Any], Error>) -> Void) {
    
    let request = VNRecognizeTextRequest { request, error in
      if let error = error {
        completion(.failure(error))
        return
      }
      
      guard let observations = request.results as? [VNRecognizedTextObservation] else {
        completion(.failure(NSError(domain: "OCR", code: -1, userInfo: [NSLocalizedDescriptionKey: "No text found"])))
        return
      }
      
      // Extract all recognized text
      var recognizedTexts: [(text: String, boundingBox: CGRect)] = []
      
      for observation in observations {
        guard let topCandidate = observation.topCandidates(1).first else { continue }
        let text = topCandidate.string
        let boundingBox = observation.boundingBox
        recognizedTexts.append((text: text, boundingBox: boundingBox))
      }
      
      // Parse ID card information
      let idCardInfo = self.parseIDCardInfo(from: recognizedTexts)
      completion(.success(idCardInfo))
    }
    
    // Configure for Chinese text recognition
    request.recognitionLanguages = ["zh-Hans", "en-US"]
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    
    // Perform request
    let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try requestHandler.perform([request])
      } catch {
        completion(.failure(error))
      }
    }
  }
  
  // MARK: - ID Card Info Parsing
  
  private func parseIDCardInfo(from recognizedTexts: [(text: String, boundingBox: CGRect)]) -> [String: Any] {
    
    var result: [String: Any] = [:]
    var allTexts: [String] = []
    
    // Sort texts by vertical position (top to bottom)
    let sortedTexts = recognizedTexts.sorted { $0.boundingBox.origin.y > $1.boundingBox.origin.y }
    
    for item in sortedTexts {
      let text = item.text.trimmingCharacters(in: .whitespacesAndNewlines)
      allTexts.append(text)
    }
    
    // Join all texts for easier parsing
    let fullText = allTexts.joined(separator: " ")
    
    // Extract name (姓名)
    if let nameRange = fullText.range(of: "姓名") {
      let afterName = String(fullText[nameRange.upperBound...])
      // 提取紧跟在"姓名"后面的2-4个汉字
      let namePattern = "^([\\u{4e00-9fa5}]{2,4})"
      if let nameMatch = afterName.range(of: namePattern, options: .regularExpression) {
        let name = String(afterName[nameMatch]).trimmingCharacters(in: .whitespaces)
        result["name"] = name
      }
    }
    
    // 如果没找到，尝试从rawTexts中查找
    if result["name"] == nil {
      for text in allTexts {
        if text.hasPrefix("姓名") {
          let name = text.replacingOccurrences(of: "姓名", with: "").trimmingCharacters(in: .whitespaces)
          if name.count >= 2 && name.count <= 4 {
            result["name"] = name
            break
          }
        }
      }
    }
    
    // Extract gender (性别)
    if let genderRange = fullText.range(of: "性别") {
      let afterGender = String(fullText[genderRange.upperBound...])
      if afterGender.contains("男") {
        result["gender"] = "男"
      } else if afterGender.contains("女") {
        result["gender"] = "女"
      }
    }
    
    // Extract nationality (民族)
    if let nationalityRange = fullText.range(of: "民族") {
      let afterNationality = String(fullText[nationalityRange.upperBound...])
      let nationalityPattern = "([\\u{4e00-9fa5}]{1,3})"
      if let nationalityMatch = afterNationality.range(of: nationalityPattern, options: .regularExpression) {
        let nationality = String(afterNationality[nationalityMatch])
        result["nationality"] = nationality
      }
    }
    
    // Extract ID number first (most reliable source for birth date)
    let idPattern = "([0-9]{17}[0-9Xx])"
    var idNumber: String?
    if let idMatch = fullText.range(of: idPattern, options: .regularExpression) {
      idNumber = String(fullText[idMatch])
      result["idNumber"] = idNumber
      
      // Extract birth date from ID number (most accurate)
      if let id = idNumber, id.count == 18 {
        let birthYearFromID = String(id.dropFirst(6).prefix(4))
        let birthMonthFromID = String(id.dropFirst(10).prefix(2))
        let birthDayFromID = String(id.dropFirst(12).prefix(2))
        
        result["birthDate"] = "\(birthYearFromID)年\(birthMonthFromID)月\(birthDayFromID)日"
        result["birthYear"] = birthYearFromID
        result["birthMonth"] = birthMonthFromID
        result["birthDay"] = birthDayFromID
        
        // Extract gender from ID number (second to last digit)
        let genderDigit = Int(String(id.dropFirst(16).prefix(1))) ?? 0
        if result["gender"] == nil {
          result["gender"] = genderDigit % 2 == 0 ? "女" : "男"
        }
      }
    }
    
    // If no ID number found, try to extract birth date from text
    if result["birthDate"] == nil {
      // 先尝试匹配完整的日期格式
      let birthPattern = "(\\d{4})年(\\d{1,2})月(\\d{1,2})日"
      if let birthMatch = fullText.range(of: birthPattern, options: .regularExpression) {
        let birthStr = String(fullText[birthMatch])
        result["birthDate"] = birthStr
        
        // Parse year, month, day
        let components = birthStr.components(separatedBy: CharacterSet(charactersIn: "年月日"))
        if components.count >= 3 {
          result["birthYear"] = components[0]
          result["birthMonth"] = components[1]
          result["birthDay"] = components[2]
        }
      }
    }
    
    // Extract address (住址)
    if let addressRange = fullText.range(of: "住址") {
      let afterAddress = String(fullText[addressRange.upperBound...])
      // Extract until we hit ID number pattern
      let addressPattern = "([\\u{4e00-9fa5}0-9]{5,50})"
      if let addressMatch = afterAddress.range(of: addressPattern, options: .regularExpression) {
        let address = String(afterAddress[addressMatch])
        result["address"] = address
      }
    }
    
    // Add raw text for debugging
    result["rawTexts"] = allTexts
    result["fullText"] = fullText
    
    return result
  }
  
  // MARK: - Image Preprocessing
  
  @objc
  func preprocessImage(_ imageUri: String,
                      resolver: @escaping RCTPromiseResolveBlock,
                      rejecter: @escaping RCTPromiseRejectBlock) {
    
    guard let imageUrl = URL(string: imageUri) else {
      rejecter("INVALID_URI", "Invalid image URI", nil)
      return
    }
    
    var image: UIImage?
    
    if imageUri.hasPrefix("file://") {
      let path = imageUri.replacingOccurrences(of: "file://", with: "")
      image = UIImage(contentsOfFile: path)
    }
    
    guard let validImage = image else {
      rejecter("INVALID_IMAGE", "Cannot load image", nil)
      return
    }
    
    // Apply image preprocessing
    let processedImage = applyImagePreprocessing(to: validImage)
    
    // Convert to base64
    if let imageData = processedImage.jpegData(compressionQuality: 0.9) {
      let base64String = imageData.base64EncodedString()
      resolver(["uri": "data:image/jpeg;base64,\(base64String)"])
    } else {
      rejecter("PROCESSING_ERROR", "Failed to process image", nil)
    }
  }
  
  private func applyImagePreprocessing(to image: UIImage) -> UIImage {
    guard let ciImage = CIImage(image: image) else { return image }
    
    let context = CIContext()
    
    // Apply filters to enhance text recognition
    // 1. Adjust exposure and contrast
    let exposureFilter = CIFilter(name: "CIExposureAdjust")
    exposureFilter?.setValue(ciImage, forKey: kCIInputImageKey)
    exposureFilter?.setValue(0.5, forKey: kCIInputEVKey)
    
    var outputImage = exposureFilter?.outputImage ?? ciImage
    
    // 2. Increase contrast
    let contrastFilter = CIFilter(name: "CIColorControls")
    contrastFilter?.setValue(outputImage, forKey: kCIInputImageKey)
    contrastFilter?.setValue(1.2, forKey: kCIInputContrastKey)
    
    outputImage = contrastFilter?.outputImage ?? outputImage
    
    // 3. Sharpen
    let sharpenFilter = CIFilter(name: "CISharpenLuminance")
    sharpenFilter?.setValue(outputImage, forKey: kCIInputImageKey)
    sharpenFilter?.setValue(0.8, forKey: kCIInputSharpnessKey)
    
    outputImage = sharpenFilter?.outputImage ?? outputImage
    
    // Convert back to UIImage
    if let cgImage = context.createCGImage(outputImage, from: outputImage.extent) {
      return UIImage(cgImage: cgImage)
    }
    
    return image
  }
}

