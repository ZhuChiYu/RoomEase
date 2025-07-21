import { Component, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'

import './app.scss'

class App extends Component<PropsWithChildren> {

  componentDidMount () {
    // 应用启动时的初始化
    console.log('RoomEase 小程序启动')
    
    // 检查更新
    this.checkUpdate()
    
    // 设置存储清理策略
    this.setupStorageCleanup()
  }

  componentDidShow () {
    // 应用进入前台时触发
  }

  componentDidHide () {
    // 应用进入后台时触发
  }

  // 检查小程序更新
  checkUpdate() {
    if (Taro.canIUse('getUpdateManager')) {
      const updateManager = Taro.getUpdateManager()
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本')
        }
      })
      
      updateManager.onUpdateReady(() => {
        Taro.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })
      
      updateManager.onUpdateFailed(() => {
        Taro.showToast({
          title: '更新失败',
          icon: 'none'
        })
      })
    }
  }

  // 设置存储清理策略
  setupStorageCleanup() {
    try {
      const info = Taro.getStorageInfoSync()
      console.log('当前存储使用:', info)
      
      // 如果存储超过限制，清理旧数据
      if (info.currentSize > 8 * 1024) { // 8MB
        Taro.clearStorageSync()
        console.log('清理存储空间')
      }
    } catch (error) {
      console.error('存储检查失败:', error)
    }
  }

  // this.props.children 是将要会渲染的页面
  render () {
    return this.props.children
  }
}

export default App 