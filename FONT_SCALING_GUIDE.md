# 系统字体适配指南

## 概述

当用户在系统设置中调整字体大小时，APP应该能够相应地调整UI布局，提供更好的无障碍体验。

## 已创建的工具

### `/apps/mobile/app/utils/responsive.ts`

提供了完整的字体和尺寸适配工具：

#### 核心函数

1. **`scaleFontSize(size, maxScale)`** - 根据系统字体缩放比例调整字体大小
   - `size`: 基础字体大小
   - `maxScale`: 最大缩放比例（默认1.3，避免字体过大）

2. **`responsiveFontSize(size, maxScale)`** - 结合屏幕宽度和系统字体缩放

3. **`scaleSize(size)`** - 根据屏幕宽度缩放尺寸

4. **`scaleHeight(size)`** - 根据屏幕高度缩放尺寸

#### 预定义常量

```typescript
import { FontSizes, Spacings, ComponentSizes } from './utils/responsive'

// 字体大小
FontSizes.tiny      // 10pt (提示文字)
FontSizes.small     // 12pt (辅助文字)
FontSizes.normal    // 14pt (正文)
FontSizes.medium    // 16pt (小标题)
FontSizes.large     // 18pt (标题)
FontSizes.xlarge    // 20pt (大标题)
FontSizes.xxlarge   // 24pt (主标题)
FontSizes.huge      // 32pt (页面标题)
FontSizes.giant     // 64pt (Logo)

// 间距
Spacings.xs    // 4
Spacings.sm    // 8
Spacings.md    // 12
Spacings.lg    // 16
Spacings.xl    // 20
Spacings.xxl   // 24
Spacings.xxxl  // 32

// 组件尺寸
ComponentSizes.inputHeight          // 50 (输入框高度)
ComponentSizes.buttonHeight         // 50 (按钮高度)
ComponentSizes.cardPadding          // 16 (卡片内边距)
ComponentSizes.borderRadius         // 8 (圆角)
ComponentSizes.borderRadiusLarge    // 12 (大圆角)
```

## 迁移指南

### 步骤 1：导入响应式工具

```typescript
import { FontSizes, Spacings, ComponentSizes, scaleFontSize } from './utils/responsive'
```

### 步骤 2：更新样式定义

#### 修改前（固定字体大小）

```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: 32,  // 固定大小，不会跟随系统字体调整
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  input: {
    height: 50,
    fontSize: 16,
    paddingHorizontal: 16,
  },
})
```

#### 修改后（响应式字体大小）

```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: FontSizes.huge,  // 会跟随系统字体调整
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: '#6b7280',
  },
  input: {
    height: ComponentSizes.inputHeight,
    fontSize: FontSizes.medium,
    paddingHorizontal: Spacings.lg,
  },
})
```

### 步骤 3：处理固定高度组件

对于有固定高度的组件（如输入框、按钮），需要确保高度能够适应更大的字体：

#### 方法 1：使用 minHeight 代替 height

```typescript
const styles = StyleSheet.create({
  input: {
    minHeight: ComponentSizes.inputHeight,  // 使用 minHeight
    fontSize: FontSizes.medium,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,  // 添加垂直内边距
  },
})
```

#### 方法 2：动态计算高度

```typescript
import { getFontScale } from './utils/responsive'

const fontScale = getFontScale()
const inputHeight = fontScale > 1.2 
  ? ComponentSizes.inputHeight * 1.2 
  : ComponentSizes.inputHeight

const styles = StyleSheet.create({
  input: {
    height: inputHeight,
    fontSize: FontSizes.medium,
  },
})
```

### 步骤 4：处理文字截断问题

当字体变大时，固定宽度的容器可能导致文字被截断：

```typescript
<Text 
  style={styles.text}
  numberOfLines={0}          // 允许多行显示
  ellipsizeMode="tail"       // 超出时显示省略号
  adjustsFontSizeToFit={false}  // 不自动缩小字体
>
  {longText}
</Text>
```

### 步骤 5：测试不同字体大小

在 iOS 设置中调整字体大小进行测试：
1. 设置 → 显示与亮度 → 文字大小
2. 设置 → 辅助功能 → 显示与文字大小 → 更大字体

在 Android 设置中：
1. 设置 → 显示 → 字体大小

## 完整示例

```typescript
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { FontSizes, Spacings, ComponentSizes } from './utils/responsive'

export default function ExampleScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🏨</Text>
          <Text style={styles.title}>欢迎回来</Text>
          <Text style={styles.subtitle}>登录到您的账户</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>邮箱</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="请输入邮箱"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>密码</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="请输入密码"
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>登录</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacings.xxxl,
    marginBottom: Spacings.xxxl,
    paddingHorizontal: Spacings.xl,
  },
  logo: {
    fontSize: FontSizes.giant,  // 64pt，会跟随系统字体调整
    marginBottom: Spacings.lg,
  },
  title: {
    fontSize: FontSizes.huge,  // 32pt
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: Spacings.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.medium,  // 16pt
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: Spacings.xl,
  },
  inputContainer: {
    marginBottom: Spacings.lg,
  },
  label: {
    fontSize: FontSizes.normal,  // 14pt
    fontWeight: '600',
    color: '#374151',
    marginBottom: Spacings.sm,
  },
  input: {
    minHeight: ComponentSizes.inputHeight,  // 最小高度50，适应大字体
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: ComponentSizes.borderRadius,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,  // 添加垂直内边距
    fontSize: FontSizes.medium,
    backgroundColor: '#fff',
  },
  loginButton: {
    minHeight: ComponentSizes.buttonHeight,
    backgroundColor: '#6366f1',
    borderRadius: ComponentSizes.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacings.lg,
    paddingVertical: Spacings.md,
  },
  loginButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#fff',
  },
})
```

## 注意事项

### 1. 不要过度缩放

某些元素（如Logo、图标）不应该过度缩放，使用较小的 `maxScale` 值：

```typescript
const styles = StyleSheet.create({
  logo: {
    fontSize: scaleFontSize(64, 1.05),  // 最大缩放5%
  },
})
```

### 2. 固定尺寸的图标

对于图标，如果使用图片或 SVG，尺寸应该保持相对固定：

```typescript
const styles = StyleSheet.create({
  icon: {
    width: ComponentSizes.iconMedium,  // 20pt，会根据屏幕缩放
    height: ComponentSizes.iconMedium,
  },
})
```

### 3. 列表和网格布局

当字体变大时，列表项的高度应该自适应：

```typescript
const styles = StyleSheet.create({
  listItem: {
    minHeight: ComponentSizes.inputHeight,  // 使用 minHeight
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    justifyContent: 'center',
  },
})
```

### 4. 多行文本处理

对于可能多行显示的文本，确保容器有足够的空间：

```typescript
<Text 
  style={styles.description}
  numberOfLines={0}  // 不限制行数
>
  这是一段可能很长的描述文字...
</Text>
```

## 测试检查清单

- [ ] 文字在最大字体设置下不会被截断
- [ ] 输入框和按钮高度足够容纳大字体
- [ ] 布局不会因为大字体而错乱
- [ ] 所有重要文字都能完整显示
- [ ] 导航栏和标签栏正常显示
- [ ] Modal 弹窗内容正常显示
- [ ] 列表项高度自适应
- [ ] 固定高度的组件（如头像）保持合理大小

## 批量迁移建议

### 优先级 1（高优先级）
- 登录/注册页面
- 首页
- 房态日历
- 订单详情

### 优先级 2（中优先级）
- 个人中心
- 设置页面
- 预订列表
- 房间管理

### 优先级 3（低优先级）
- 辅助页面
- 说明文档
- 协议页面

## 自动化迁移脚本（可选）

可以使用正则表达式批量替换常见的字体大小：

```javascript
// 查找: fontSize: 12,
// 替换: fontSize: FontSizes.small,

// 查找: fontSize: 14,
// 替换: fontSize: FontSizes.normal,

// 查找: fontSize: 16,
// 替换: fontSize: FontSizes.medium,

// 查找: fontSize: 18,
// 替换: fontSize: FontSizes.large,

// ... 以此类推
```

## 参考资源

- [React Native Typography](https://reactnative.dev/docs/text#typography)
- [iOS Human Interface Guidelines - Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Material Design - Typography](https://material.io/design/typography)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)

---

**创建日期**: 2025-11-29  
**作者**: AI Assistant  
**状态**: 待实施






