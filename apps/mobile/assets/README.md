# Assets 资源文件

本目录存放应用的图标、启动画面等资源文件。

## 需要的文件

- `icon.png` - 应用图标 (1024x1024)
- `splash.png` - 启动画面 (2048x2048)
- `adaptive-icon.png` - Android 自适应图标 (1024x1024)
- `favicon.png` - Web 图标 (48x48)

## 临时占位符

如果你还没有准备好设计图标，可以使用以下命令创建临时占位符：

```bash
# 使用 ImageMagick 创建简单的占位符
convert -size 1024x1024 xc:#6366f1 -gravity center -pointsize 200 -fill white -annotate +0+0 "客满云" icon.png
```

或者访问 https://www.appicon.co/ 在线生成图标。

## ✅ 当前状态

已创建临时占位符图标：
- ✓ icon.png (1024x1024) - 蓝白圆形设计
- ✓ splash.png (2048x2048) - 白底蓝圆
- ✓ adaptive-icon.png (1024x1024) - Android 图标
- ✓ favicon.png (48x48) - Web 图标

这些是简单的占位符，可以正常使用。后续建议：

1. **使用设计工具创建专业图标**：
   - Figma
   - Sketch
   - Adobe Illustrator

2. **在线图标生成器**：
   - https://www.appicon.co/
   - https://makeappicon.com/
   - https://icon.kitchen/

3. **推荐尺寸**：
   - App Icon: 1024x1024 (iOS), 512x512 (Android)
   - Splash Screen: 2048x2048 或更大
   
4. **设计建议**：
   - 简洁明了，一眼识别
   - 品牌色：#6366f1 (蓝紫色)
   - 可以包含"客满云"或"K"字母元素
