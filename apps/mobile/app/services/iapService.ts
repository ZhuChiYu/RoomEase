/**
 * IAP (In-App Purchase) 订阅服务
 * 处理App Store订阅购买、恢复、验证等功能
 * 
 * 注意：此文件暂时用作占位符，实际功能待后续实现
 * 需要安装: npm install expo-store-review
 */

import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 订阅产品ID（需要在App Store Connect中创建）
export const SUBSCRIPTION_PRODUCTS = {
  FREE: 'free', // 免费版（虚拟ID，不需要在App Store创建）
  PRO_MONTHLY: 'com.kemancloud.mobile.pro.monthly', // 专业版月度
  PRO_YEARLY: 'com.kemancloud.mobile.pro.yearly', // 专业版年度
  ENTERPRISE_YEARLY: 'com.kemancloud.mobile.enterprise.yearly', // 企业版年度
} as const;

// 订阅等级
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

// 订阅状态
export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: Date;
  productId?: string;
  purchaseDate?: Date;
  isTrialPeriod?: boolean;
  roomLimit: number;
}

// 产品信息
export interface ProductInfo {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceValue: number;
  currency: string;
  tier: SubscriptionTier;
  roomLimit: number;
  features: string[];
}

// 本地存储键
const STORAGE_KEYS = {
  SUBSCRIPTION_STATUS: '@kemancloud:subscription_status',
  LAST_PURCHASE_CHECK: '@kemancloud:last_purchase_check',
  TRIAL_START_DATE: '@kemancloud:trial_start_date',
};

/**
 * IAP服务类
 */
class IAPService {
  private subscriptionStatus: SubscriptionStatus | null = null;
  private products: ProductInfo[] = [];
  private isInitialized = false;

  /**
   * 初始化IAP服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // iOS平台才需要初始化IAP
      if (Platform.OS !== 'ios') {
        console.log('IAP只支持iOS平台');
        this.isInitialized = true;
        return;
      }

      // TODO: 集成 react-native-iap 或 expo-in-app-purchases
      // 示例代码（需要安装对应库）：
      /*
      import * as InAppPurchases from 'expo-in-app-purchases';
      
      await InAppPurchases.connectAsync();
      
      // 获取产品信息
      const { results } = await InAppPurchases.getProductsAsync([
        SUBSCRIPTION_PRODUCTS.PRO_MONTHLY,
        SUBSCRIPTION_PRODUCTS.PRO_YEARLY,
        SUBSCRIPTION_PRODUCTS.ENTERPRISE_YEARLY,
      ]);
      
      this.products = results.map(this.mapProduct);
      */

      // 从本地存储加载订阅状态
      await this.loadSubscriptionStatus();

      this.isInitialized = true;
      console.log('IAP服务初始化成功');
    } catch (error) {
      console.error('IAP初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取产品列表
   */
  async getProducts(): Promise<ProductInfo[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 如果还没有从App Store获取到产品，返回模拟数据
    if (this.products.length === 0) {
      return this.getMockProducts();
    }

    return this.products;
  }

  /**
   * 获取当前订阅状态
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    if (!this.subscriptionStatus) {
      await this.loadSubscriptionStatus();
    }

    // 如果没有订阅信息，返回免费版
    if (!this.subscriptionStatus) {
      return this.getFreeSubscription();
    }

    // 检查订阅是否过期
    if (this.subscriptionStatus.expiresAt) {
      const now = new Date();
      if (now > this.subscriptionStatus.expiresAt) {
        // 订阅已过期，重置为免费版
        this.subscriptionStatus = this.getFreeSubscription();
        await this.saveSubscriptionStatus();
      }
    }

    return this.subscriptionStatus;
  }

  /**
   * 购买订阅
   */
  async purchaseSubscription(productId: string): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('提示', '订阅功能仅支持iOS平台');
        return false;
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      // TODO: 实际购买逻辑（需要集成IAP库）
      /*
      import * as InAppPurchases from 'expo-in-app-purchases';
      
      await InAppPurchases.purchaseItemAsync(productId);
      
      // 验证收据
      const isValid = await this.verifyReceipt();
      if (isValid) {
        await this.updateSubscriptionStatus(productId);
        return true;
      }
      */

      // 开发阶段：模拟购买成功
      console.log('模拟购买订阅:', productId);
      await this.simulatePurchase(productId);

      Alert.alert(
        '购买成功',
        '感谢您订阅客满云专业版！',
        [
          {
            text: '确定',
            onPress: () => {
              // 可以请求评分
              this.requestReview();
            },
          },
        ]
      );

      return true;
    } catch (error: any) {
      console.error('购买失败:', error);
      
      // 用户取消购买
      if (error.code === 'E_USER_CANCELLED') {
        return false;
      }

      Alert.alert('购买失败', error.message || '请稍后重试');
      return false;
    }
  }

  /**
   * 恢复购买
   */
  async restorePurchases(): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('提示', '恢复购买功能仅支持iOS平台');
        return false;
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      // TODO: 实际恢复逻辑
      /*
      import * as InAppPurchases from 'expo-in-app-purchases';
      
      const history = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (history.results.length > 0) {
        // 找到最新的有效订阅
        const latestPurchase = history.results[0];
        await this.updateSubscriptionStatus(latestPurchase.productId);
        return true;
      }
      */

      // 开发阶段：从本地恢复
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
      if (saved) {
        Alert.alert('恢复成功', '已恢复您的订阅信息');
        return true;
      } else {
        Alert.alert('提示', '没有找到可恢复的购买记录');
        return false;
      }
    } catch (error) {
      console.error('恢复购买失败:', error);
      Alert.alert('恢复失败', '请稍后重试');
      return false;
    }
  }

  /**
   * 检查是否可以使用某个功能
   */
  async canUseFeature(requiredTier: SubscriptionTier): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    
    if (!status.isActive) {
      return false;
    }

    const tierLevel = {
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.PRO]: 1,
      [SubscriptionTier.ENTERPRISE]: 2,
    };

    return tierLevel[status.tier] >= tierLevel[requiredTier];
  }

  /**
   * 检查房间数量限制
   */
  async checkRoomLimit(currentRoomCount: number): Promise<{
    allowed: boolean;
    limit: number;
    message?: string;
  }> {
    const status = await this.getSubscriptionStatus();
    const limit = status.roomLimit;

    if (currentRoomCount >= limit) {
      return {
        allowed: false,
        limit,
        message: `您当前的${this.getTierName(status.tier)}最多支持${limit}间房间。\n\n升级到更高版本以管理更多房间。`,
      };
    }

    return {
      allowed: true,
      limit,
    };
  }

  /**
   * 显示升级提示
   */
  async showUpgradePrompt(feature: string): Promise<void> {
    const status = await this.getSubscriptionStatus();

    Alert.alert(
      '升级到专业版',
      `${feature}是专业版功能。\n\n当前版本：${this.getTierName(status.tier)}\n\n升级到专业版即可使用：\n• 管理最多30间房\n• 高级数据统计\n• 优先客服支持\n• 数据云端备份`,
      [
        {
          text: '稍后再说',
          style: 'cancel',
        },
        {
          text: '立即升级',
          onPress: () => {
            // TODO: 导航到订阅页面
            console.log('导航到订阅页面');
          },
        },
      ]
    );
  }

  /**
   * 请求应用评分
   * TODO: 需要安装 expo-store-review 后启用
   */
  async requestReview(): Promise<void> {
    try {
      // const StoreReview = require('expo-store-review');
      // const isAvailable = await StoreReview.isAvailableAsync();
      // if (isAvailable) {
      //   await StoreReview.requestReview();
      // }
      console.log('请求评分功能待实现');
    } catch (error) {
      console.error('请求评分失败:', error);
    }
  }

  // ===== 私有方法 =====

  /**
   * 从本地存储加载订阅状态
   */
  private async loadSubscriptionStatus(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 转换日期字符串为Date对象
        if (parsed.expiresAt) {
          parsed.expiresAt = new Date(parsed.expiresAt);
        }
        if (parsed.purchaseDate) {
          parsed.purchaseDate = new Date(parsed.purchaseDate);
        }
        this.subscriptionStatus = parsed;
      } else {
        this.subscriptionStatus = this.getFreeSubscription();
      }
    } catch (error) {
      console.error('加载订阅状态失败:', error);
      this.subscriptionStatus = this.getFreeSubscription();
    }
  }

  /**
   * 保存订阅状态到本地存储
   */
  private async saveSubscriptionStatus(): Promise<void> {
    try {
      if (this.subscriptionStatus) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SUBSCRIPTION_STATUS,
          JSON.stringify(this.subscriptionStatus)
        );
      }
    } catch (error) {
      console.error('保存订阅状态失败:', error);
    }
  }

  /**
   * 获取免费版订阅
   */
  private getFreeSubscription(): SubscriptionStatus {
    return {
      tier: SubscriptionTier.FREE,
      isActive: true,
      roomLimit: 5,
    };
  }

  /**
   * 模拟购买（开发阶段使用）
   */
  private async simulatePurchase(productId: string): Promise<void> {
    let tier: SubscriptionTier;
    let roomLimit: number;
    let expiresAt: Date;

    switch (productId) {
      case SUBSCRIPTION_PRODUCTS.PRO_MONTHLY:
        tier = SubscriptionTier.PRO;
        roomLimit = 30;
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        break;
      case SUBSCRIPTION_PRODUCTS.PRO_YEARLY:
        tier = SubscriptionTier.PRO;
        roomLimit = 30;
        expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        break;
      case SUBSCRIPTION_PRODUCTS.ENTERPRISE_YEARLY:
        tier = SubscriptionTier.ENTERPRISE;
        roomLimit = 999;
        expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        break;
      default:
        return;
    }

    this.subscriptionStatus = {
      tier,
      isActive: true,
      expiresAt,
      productId,
      purchaseDate: new Date(),
      isTrialPeriod: false,
      roomLimit,
    };

    await this.saveSubscriptionStatus();
  }

  /**
   * 获取订阅等级名称
   */
  private getTierName(tier: SubscriptionTier): string {
    switch (tier) {
      case SubscriptionTier.FREE:
        return '免费版';
      case SubscriptionTier.PRO:
        return '专业版';
      case SubscriptionTier.ENTERPRISE:
        return '企业版';
      default:
        return '未知';
    }
  }

  /**
   * 获取模拟产品列表（开发阶段）
   */
  private getMockProducts(): ProductInfo[] {
    return [
      {
        productId: SUBSCRIPTION_PRODUCTS.FREE,
        title: '基础版',
        description: '适合5间房以下的小民宿',
        price: '免费',
        priceValue: 0,
        currency: 'CNY',
        tier: SubscriptionTier.FREE,
        roomLimit: 5,
        features: [
          '最多管理5间房',
          '基础预订管理',
          '房态日历',
          '基础统计',
        ],
      },
      {
        productId: SUBSCRIPTION_PRODUCTS.PRO_MONTHLY,
        title: '专业版（月付）',
        description: '解锁专业版全部功能',
        price: '¥68/月',
        priceValue: 68,
        currency: 'CNY',
        tier: SubscriptionTier.PRO,
        roomLimit: 30,
        features: [
          '最多管理30间房',
          '完整预订管理',
          '高级数据统计',
          '财务报表',
          '云端数据备份',
          '优先客服支持',
        ],
      },
      {
        productId: SUBSCRIPTION_PRODUCTS.PRO_YEARLY,
        title: '专业版（年付）',
        description: '年付更优惠，节省28%',
        price: '¥588/年',
        priceValue: 588,
        currency: 'CNY',
        tier: SubscriptionTier.PRO,
        roomLimit: 30,
        features: [
          '✨ 相当于¥49/月',
          '最多管理30间房',
          '完整预订管理',
          '高级数据统计',
          '财务报表',
          '云端数据备份',
          '优先客服支持',
        ],
      },
      {
        productId: SUBSCRIPTION_PRODUCTS.ENTERPRISE_YEARLY,
        title: '企业版（年付）',
        description: '适合多店管理和团队协作',
        price: '¥1688/年',
        priceValue: 1688,
        currency: 'CNY',
        tier: SubscriptionTier.ENTERPRISE,
        roomLimit: 999,
        features: [
          '无限房间数量',
          '多店统一管理',
          '团队协作功能',
          '高级财务分析',
          '自定义报表',
          '专属客户经理',
          'API接口支持',
        ],
      },
    ];
  }

  /**
   * 映射产品信息
   */
  private mapProduct(product: any): ProductInfo {
    // 根据productId判断订阅等级
    let tier: SubscriptionTier;
    let roomLimit: number;

    if (product.productId.includes('enterprise')) {
      tier = SubscriptionTier.ENTERPRISE;
      roomLimit = 999;
    } else if (product.productId.includes('pro')) {
      tier = SubscriptionTier.PRO;
      roomLimit = 30;
    } else {
      tier = SubscriptionTier.FREE;
      roomLimit = 5;
    }

    return {
      productId: product.productId,
      title: product.title,
      description: product.description,
      price: product.priceString,
      priceValue: product.price,
      currency: product.currencyCode,
      tier,
      roomLimit,
      features: [], // 需要手动配置
    };
  }

  /**
   * 验证收据（服务器端验证）
   */
  private async verifyReceipt(): Promise<boolean> {
    try {
      // TODO: 发送收据到服务器验证
      /*
      const receipt = await InAppPurchases.finishTransactionAsync(purchase, false);
      
      const response = await fetch('https://your-api.com/verify-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt,
          platform: Platform.OS,
        }),
      });
      
      const result = await response.json();
      return result.valid;
      */

      // 开发阶段：直接返回true
      return true;
    } catch (error) {
      console.error('验证收据失败:', error);
      return false;
    }
  }
}

// 导出单例
export const iapService = new IAPService();

// 导出便捷方法
export const initializeIAP = () => iapService.initialize();
export const getProducts = () => iapService.getProducts();
export const getSubscriptionStatus = () => iapService.getSubscriptionStatus();
export const purchaseSubscription = (productId: string) =>
  iapService.purchaseSubscription(productId);
export const restorePurchases = () => iapService.restorePurchases();
export const canUseFeature = (tier: SubscriptionTier) =>
  iapService.canUseFeature(tier);
export const checkRoomLimit = (count: number) => iapService.checkRoomLimit(count);
export const showUpgradePrompt = (feature: string) =>
  iapService.showUpgradePrompt(feature);

