/**
 * 字体和尺寸适配工具
 * 用于适配系统字体大小设置，提供更好的无障碍体验
 */

import { Dimensions, PixelRatio } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// 基准屏幕宽度（iPhone 12/13/14 Pro）
const BASE_WIDTH = 390
const BASE_HEIGHT = 844

/**
 * 根据屏幕宽度缩放尺寸
 * @param size 设计稿上的尺寸
 * @returns 缩放后的尺寸
 */
export const scaleSize = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size
}

/**
 * 根据屏幕高度缩放尺寸
 * @param size 设计稿上的尺寸
 * @returns 缩放后的尺寸
 */
export const scaleHeight = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size
}

/**
 * 字体大小缩放
 * 使用 PixelRatio.getFontScale() 获取系统字体缩放比例
 * @param size 基础字体大小
 * @param maxScale 最大缩放比例（避免字体过大）
 * @returns 缩放后的字体大小
 */
export const scaleFontSize = (size: number, maxScale: number = 1.3): number => {
  const fontScale = PixelRatio.getFontScale()
  const actualScale = Math.min(fontScale, maxScale)
  return size * actualScale
}

/**
 * 响应式字体大小
 * 结合屏幕宽度和系统字体缩放
 * @param size 基础字体大小
 * @param maxScale 最大字体缩放比例
 * @returns 响应式字体大小
 */
export const responsiveFontSize = (size: number, maxScale: number = 1.3): number => {
  const scaledSize = scaleSize(size)
  return scaleFontSize(scaledSize, maxScale)
}

/**
 * 限制字体缩放的最小和最大值
 * @param size 基础字体大小
 * @param min 最小字体大小
 * @param max 最大字体大小
 * @returns 限制范围内的字体大小
 */
export const clampFontSize = (size: number, min: number, max: number): number => {
  const scaled = scaleFontSize(size)
  return Math.min(Math.max(scaled, min), max)
}

/**
 * 垂直间距缩放
 * @param size 基础间距
 * @returns 缩放后的间距
 */
export const scaleVerticalSize = (size: number): number => {
  return scaleHeight(size)
}

/**
 * 水平间距缩放
 * @param size 基础间距
 * @returns 缩放后的间距
 */
export const scaleHorizontalSize = (size: number): number => {
  return scaleSize(size)
}

/**
 * 判断是否是小屏设备
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375
}

/**
 * 判断是否是大屏设备
 */
export const isLargeDevice = (): boolean => {
  return SCREEN_WIDTH >= 414
}

/**
 * 获取当前字体缩放比例
 */
export const getFontScale = (): number => {
  return PixelRatio.getFontScale()
}

/**
 * 预定义的字体大小
 * 使用这些常量可以保持整个应用的字体大小一致性
 */
export const FontSizes = {
  // 超小号（提示文字、标签）
  tiny: scaleFontSize(10, 1.2),
  // 小号（辅助文字、说明）
  small: scaleFontSize(12, 1.2),
  // 正常（正文内容）
  normal: scaleFontSize(14, 1.3),
  // 中等（小标题）
  medium: scaleFontSize(16, 1.3),
  // 大号（标题）
  large: scaleFontSize(18, 1.3),
  // 超大号（主标题）
  xlarge: scaleFontSize(20, 1.2),
  xxlarge: scaleFontSize(24, 1.2),
  // 特大号（页面标题）
  huge: scaleFontSize(32, 1.1),
  // 超级大号（品牌/Logo）
  giant: scaleFontSize(64, 1.05),
}

/**
 * 预定义的间距
 */
export const Spacings = {
  xs: scaleSize(4),
  sm: scaleSize(8),
  md: scaleSize(12),
  lg: scaleSize(16),
  xl: scaleSize(20),
  xxl: scaleSize(24),
  xxxl: scaleSize(32),
}

/**
 * 预定义的组件尺寸
 */
export const ComponentSizes = {
  // 输入框高度
  inputHeight: scaleVerticalSize(50),
  inputHeightSmall: scaleVerticalSize(44),
  // 按钮高度
  buttonHeight: scaleVerticalSize(50),
  buttonHeightSmall: scaleVerticalSize(40),
  // 卡片间距
  cardPadding: scaleSize(16),
  // 圆角
  borderRadius: scaleSize(8),
  borderRadiusLarge: scaleSize(12),
  // 图标大小
  iconSmall: scaleSize(16),
  iconMedium: scaleSize(20),
  iconLarge: scaleSize(24),
}

/**
 * 屏幕尺寸
 */
export const ScreenSizes = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallDevice(),
  isLarge: isLargeDevice(),
}

/**
 * 导出所有尺寸相关的工具
 */
export default {
  scaleSize,
  scaleHeight,
  scaleFontSize,
  responsiveFontSize,
  clampFontSize,
  scaleVerticalSize,
  scaleHorizontalSize,
  isSmallDevice,
  isLargeDevice,
  getFontScale,
  FontSizes,
  Spacings,
  ComponentSizes,
  ScreenSizes,
}

