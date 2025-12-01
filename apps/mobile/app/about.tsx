import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FontSizes, Spacings, ComponentSizes } from './utils/responsive'

export default function AboutScreen() {
  const router = useRouter()

  const handleOpenWebsite = () => {
    Linking.openURL('https://kemancloud.com').catch(err =>
      console.log('无法打开网站')
    )
  }

  const handleContactEmail = () => {
    Linking.openURL('mailto:zhu.cy@outlook.com').catch(err =>
      console.log('无法打开邮件应用')
    )
  }

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>关于我们</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo和标题 */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>满客云</Text>
          </View>
          <Text style={styles.appName}>满客云</Text>
          <Text style={styles.appSubtitle}>KemanCloud</Text>
          <Text style={styles.version}>版本 1.0.0</Text>
        </View>

        {/* 产品介绍 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>产品介绍</Text>
          <Text style={styles.description}>
            满客云是一款专业的酒店民宿管理解决方案，致力于帮助中小型酒店和民宿业主轻松管理日常运营。
          </Text>
          <Text style={styles.description}>
            我们提供房态管理、预订管理、客户管理、财务管理等全方位功能，让您的经营更加高效便捷。
          </Text>
        </View>

        {/* 核心功能 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>核心功能</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📅</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>房态日历</Text>
              <Text style={styles.featureDescription}>
                直观的可视化房态管理，一目了然掌握所有房间状态
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📝</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>预订管理</Text>
              <Text style={styles.featureDescription}>
                快速创建预订，实时同步，支持在线预订和线下预订
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>👥</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>客户管理</Text>
              <Text style={styles.featureDescription}>
                完整的客户档案，支持身份证扫描，快速办理入住
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>💰</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>财务管理</Text>
              <Text style={styles.featureDescription}>
                收款、退款、账单管理，经营数据一目了然
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📊</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>数据统计</Text>
              <Text style={styles.featureDescription}>
                多维度数据分析，帮助您做出更好的经营决策
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>☁️</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>云端同步</Text>
              <Text style={styles.featureDescription}>
                数据实时同步到云端，多设备协同办公更安全
              </Text>
            </View>
          </View>
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系我们</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleOpenWebsite}>
            <Text style={styles.contactLabel}>官方网站</Text>
            <Text style={styles.contactValue}>kemancloud.com</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleContactEmail}>
            <Text style={styles.contactLabel}>联系邮箱</Text>
            <Text style={styles.contactValue}>zhu.cy@outlook.com</Text>
          </TouchableOpacity>

          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>公司地址</Text>
            <Text style={styles.contactValue}>广东省深圳市南山区科技园</Text>
          </View>
        </View>

        {/* 法律信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>法律信息</Text>
          
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/user-agreement')}
          >
            <Text style={styles.legalText}>用户协议</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/privacy-policy')}
          >
            <Text style={styles.legalText}>隐私政策</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 版权信息 */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyright}>© 2025 满客云团队</Text>
          <Text style={styles.copyright}>保留所有权利</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6366f1',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: Spacings.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    color: 'white',
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: Spacings.xxxl,
    backgroundColor: 'white',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  appName: {
    fontSize: FontSizes.xxlarge,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacings.xs,
  },
  appSubtitle: {
    fontSize: FontSizes.medium,
    color: '#64748b',
    marginBottom: Spacings.sm,
  },
  version: {
    fontSize: FontSizes.normal,
    color: '#94a3b8',
  },
  section: {
    marginTop: Spacings.xl,
    paddingHorizontal: Spacings.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacings.md,
  },
  description: {
    fontSize: FontSizes.normal,
    color: '#475569',
    lineHeight: 24,
    marginBottom: Spacings.md,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    marginBottom: Spacings.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacings.md,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: FontSizes.normal,
    color: '#64748b',
    lineHeight: 20,
  },
  contactItem: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    marginBottom: Spacings.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contactLabel: {
    fontSize: FontSizes.normal,
    color: '#64748b',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: FontSizes.medium,
    color: '#6366f1',
    fontWeight: '500',
  },
  legalItem: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    marginBottom: Spacings.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  legalText: {
    fontSize: FontSizes.medium,
    color: '#1e293b',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 28,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  copyrightSection: {
    alignItems: 'center',
    marginTop: Spacings.xxl,
    marginBottom: Spacings.xl,
  },
  copyright: {
    fontSize: FontSizes.small,
    color: '#94a3b8',
    marginBottom: 4,
  },
})

