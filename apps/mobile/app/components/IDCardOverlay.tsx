import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Svg, { Rect, Defs, Mask, Line } from 'react-native-svg'

const { width, height } = Dimensions.get('window')

// 中国身份证标准尺寸比例 85.6mm x 54mm
const ID_CARD_RATIO = 85.6 / 54

interface IDCardOverlayProps {
  showGuide?: boolean
}

export function IDCardOverlay({ showGuide = true }: IDCardOverlayProps) {
  // 计算身份证框的尺寸（占屏幕宽度的85%）
  const cardWidth = width * 0.85
  const cardHeight = cardWidth / ID_CARD_RATIO
  
  // 计算居中位置
  const cardLeft = (width - cardWidth) / 2
  const cardTop = (height - cardHeight) / 2

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 半透明遮罩 */}
      <Svg width={width} height={height} style={styles.svg}>
        <Defs>
          <Mask id="mask" x="0" y="0" width={width} height={height}>
            {/* 白色背景 */}
            <Rect x="0" y="0" width={width} height={height} fill="white" />
            {/* 黑色镂空区域（身份证框） */}
            <Rect
              x={cardLeft}
              y={cardTop}
              width={cardWidth}
              height={cardHeight}
              rx={8}
              ry={8}
              fill="black"
            />
          </Mask>
        </Defs>
        {/* 应用遮罩 */}
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#mask)"
        />
      </Svg>

        {/* 身份证边框和引导线 */}
      <View
        style={[
          styles.cardFrame,
          {
            left: cardLeft,
            top: cardTop,
            width: cardWidth,
            height: cardHeight,
          },
        ]}
      >
        {/* 四个角的标记 */}
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />

        {/* 身份证正面布局提示线 - 根据真实身份证布局 */}
        <Svg width={cardWidth} height={cardHeight} style={styles.guideLines}>
          {/* 左侧信息区域（姓名、性别、民族、出生、住址） */}
          {/* 姓名行 */}
          <Line
            x1={cardWidth * 0.08}
            y1={cardHeight * 0.18}
            x2={cardWidth * 0.55}
            y2={cardHeight * 0.18}
            stroke="rgba(76, 175, 80, 0.3)"
            strokeWidth="1"
          />
          
          {/* 性别和民族行 */}
          <Line
            x1={cardWidth * 0.08}
            y1={cardHeight * 0.30}
            x2={cardWidth * 0.55}
            y2={cardHeight * 0.30}
            stroke="rgba(76, 175, 80, 0.3)"
            strokeWidth="1"
          />
          
          {/* 出生日期行 */}
          <Line
            x1={cardWidth * 0.08}
            y1={cardHeight * 0.42}
            x2={cardWidth * 0.55}
            y2={cardHeight * 0.42}
            stroke="rgba(76, 175, 80, 0.3)"
            strokeWidth="1"
          />
          
          {/* 住址区域 */}
          <Line
            x1={cardWidth * 0.08}
            y1={cardHeight * 0.54}
            x2={cardWidth * 0.55}
            y2={cardHeight * 0.54}
            stroke="rgba(76, 175, 80, 0.3)"
            strokeWidth="1"
          />
          <Line
            x1={cardWidth * 0.08}
            y1={cardHeight * 0.66}
            x2={cardWidth * 0.55}
            y2={cardHeight * 0.66}
            stroke="rgba(76, 175, 80, 0.3)"
            strokeWidth="1"
          />
          
          {/* 右侧照片区域 */}
          <Rect
            x={cardWidth * 0.62}
            y={cardHeight * 0.15}
            width={cardWidth * 0.30}
            height={cardHeight * 0.45}
            stroke="rgba(76, 175, 80, 0.4)"
            strokeWidth="1.5"
            fill="none"
            rx="4"
          />
          
          {/* 底部身份证号码区域 */}
          <Line
            x1={cardWidth * 0.15}
            y1={cardHeight * 0.85}
            x2={cardWidth * 0.85}
            y2={cardHeight * 0.85}
            stroke="rgba(76, 175, 80, 0.5)"
            strokeWidth="2"
          />
        </Svg>
      </View>

      {/* 提示文字 */}
      {showGuide && (
        <View style={styles.guideContainer}>
          <View style={[styles.guideBox, { top: cardTop - 80 }]}>
            <Text style={styles.guideTitle}>请将身份证正面对准框内</Text>
            <Text style={styles.guideSubtitle}>确保文字清晰，避免反光</Text>
          </View>

          <View style={[styles.tipsContainer, { top: cardTop + cardHeight + 40 }]}>
            <View style={styles.tipItem}>
              <View style={styles.tipIconCircle}>
                <Text style={styles.tipEmoji}>💡</Text>
              </View>
              <Text style={styles.tipLabel}>光线充足</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipIconCircle}>
                <Text style={styles.tipEmoji}>📱</Text>
              </View>
              <Text style={styles.tipLabel}>保持水平</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipIconCircle}>
                <Text style={styles.tipEmoji}>🎯</Text>
              </View>
              <Text style={styles.tipLabel}>对准边框</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  svg: {
    position: 'absolute',
  },
  cardFrame: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 8,
    borderStyle: 'solid',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
    borderWidth: 5,
  },
  cornerTopLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  guideLines: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  guideContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  guideBox: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    minWidth: 280,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
    textAlign: 'center',
  },
  guideSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  tipsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  tipItem: {
    alignItems: 'center',
  },
  tipIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipEmoji: {
    fontSize: 22,
  },
  tipLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
