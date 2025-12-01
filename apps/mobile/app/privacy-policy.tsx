import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FontSizes, Spacings, ComponentSizes } from './utils/responsive'

export default function PrivacyPolicyScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>隐私政策</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.updateInfo}>
          <Text style={styles.updateText}>更新日期：2025年1月1日</Text>
          <Text style={styles.updateText}>生效日期：2025年1月1日</Text>
        </View>

        <Text style={styles.welcome}>
          客满云隐私政策
        </Text>

        <Text style={styles.intro}>
          客满云团队（以下简称"我们"）非常重视用户的隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。请您仔细阅读本政策，以了解我们对您个人信息的处理方式。
        </Text>

        {/* 第一条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>一、我们收集的信息</Text>
          <Text style={styles.paragraph}>
            为了向您提供客满云服务，我们可能会收集以下类型的信息：
          </Text>
          
          <Text style={styles.subTitle}>1.1 您主动提供的信息</Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>账号信息：</Text>注册时提供的姓名、邮箱、手机号、密码等
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>业务信息：</Text>酒店/民宿名称、地址、房型房间信息等
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>客户信息：</Text>您录入的客人姓名、身份证号、联系方式等
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>财务信息：</Text>预订金额、收款退款记录等
          </Text>

          <Text style={styles.subTitle}>1.2 自动收集的信息</Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>设备信息：</Text>设备型号、操作系统版本、设备标识符等
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>日志信息：</Text>IP地址、访问时间、操作记录等
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>应用使用信息：</Text>功能使用情况、错误日志等
          </Text>
        </View>

        {/* 第二条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>二、我们如何使用收集的信息</Text>
          <Text style={styles.paragraph}>
            我们收集您的信息主要用于以下目的：
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>提供服务：</Text>为您提供酒店民宿管理的核心功能
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>改进服务：</Text>分析使用情况，优化产品功能和用户体验
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>安全保障：</Text>检测和预防欺诈、滥用和安全问题
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>客户支持：</Text>响应您的咨询和技术支持请求
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>通知推送：</Text>向您发送重要的业务通知和系统消息
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>法律要求：</Text>遵守法律法规和监管要求
          </Text>
        </View>

        {/* 第三条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>三、信息的存储</Text>
          <Text style={styles.paragraph}>
            3.1 <Text style={styles.bold}>存储位置：</Text>您的信息存储在中华人民共和国境内的服务器上。如需跨境传输，我们会严格遵守相关法律法规。
          </Text>
          <Text style={styles.paragraph}>
            3.2 <Text style={styles.bold}>存储期限：</Text>我们仅在实现目的所必需的期限内保留您的个人信息。账号注销后，我们会删除或匿名化您的个人信息，除非法律法规另有规定。
          </Text>
          <Text style={styles.paragraph}>
            3.3 <Text style={styles.bold}>数据备份：</Text>为确保数据安全，我们会定期备份您的数据，备份数据同样受到本隐私政策的保护。
          </Text>
        </View>

        {/* 第四条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>四、信息的共享、转让和公开披露</Text>
          
          <Text style={styles.subTitle}>4.1 共享</Text>
          <Text style={styles.paragraph}>
            我们不会与任何公司、组织和个人共享您的个人信息，除非：
          </Text>
          <Text style={styles.listItem}>
            • 获得您的明确同意
          </Text>
          <Text style={styles.listItem}>
            • 根据法律法规或监管部门的要求
          </Text>
          <Text style={styles.listItem}>
            • 与授权合作伙伴共享，但仅限于提供服务所必需的信息
          </Text>

          <Text style={styles.subTitle}>4.2 转让</Text>
          <Text style={styles.paragraph}>
            我们不会将您的个人信息转让给任何公司、组织和个人，除非：
          </Text>
          <Text style={styles.listItem}>
            • 获得您的明确同意
          </Text>
          <Text style={styles.listItem}>
            • 在涉及合并、收购或破产清算时，如涉及到个人信息转让，我们会要求新的持有您个人信息的公司继续受本隐私政策的约束
          </Text>

          <Text style={styles.subTitle}>4.3 公开披露</Text>
          <Text style={styles.paragraph}>
            我们仅会在以下情况下公开披露您的个人信息：
          </Text>
          <Text style={styles.listItem}>
            • 获得您的明确同意
          </Text>
          <Text style={styles.listItem}>
            • 基于法律法规、法律程序、诉讼或政府主管部门的要求
          </Text>
        </View>

        {/* 第五条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>五、信息安全</Text>
          <Text style={styles.paragraph}>
            我们非常重视信息安全，采取了以下措施保护您的个人信息：
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>数据加密：</Text>使用加密技术对敏感信息进行加密存储和传输
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>访问控制：</Text>严格限制对个人信息的访问权限，仅授权人员可访问
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>安全审计：</Text>定期进行安全审计和漏洞扫描
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>应急响应：</Text>建立了安全事件应急响应机制
          </Text>
          <Text style={styles.paragraph}>
            尽管我们已采取合理措施保护您的信息，但请理解在互联网环境下不存在绝对的安全。
          </Text>
        </View>

        {/* 第六条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>六、您的权利</Text>
          <Text style={styles.paragraph}>
            根据相关法律法规，您对自己的个人信息享有以下权利：
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>访问权：</Text>您有权访问您的个人信息，法律法规规定的例外情况除外
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>更正权：</Text>如发现个人信息不准确或不完整，您有权要求更正或补充
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>删除权：</Text>在某些情况下，您有权要求我们删除您的个人信息
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>撤回同意：</Text>您有权撤回您此前做出的同意
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>注销账号：</Text>您可以随时注销您的账号
          </Text>
          <Text style={styles.paragraph}>
            如需行使上述权利，请通过本政策底部的联系方式与我们联系。
          </Text>
        </View>

        {/* 第七条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>七、未成年人保护</Text>
          <Text style={styles.paragraph}>
            7.1 我们的服务主要面向成年人。如果您是未满18周岁的未成年人，请在监护人的陪同下阅读本政策，并在征得监护人同意后使用我们的服务。
          </Text>
          <Text style={styles.paragraph}>
            7.2 对于经监护人同意而收集的未成年人个人信息，我们会严格按照法律法规的要求进行保护。
          </Text>
        </View>

        {/* 第八条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>八、第三方服务</Text>
          <Text style={styles.paragraph}>
            8.1 我们的服务可能包含第三方提供的功能或服务，如地图、支付等。这些第三方服务由相应的第三方负责运营。
          </Text>
          <Text style={styles.paragraph}>
            8.2 您使用这些第三方服务时，除遵守本政策外，还应遵守第三方的用户协议和隐私政策。
          </Text>
          <Text style={styles.paragraph}>
            8.3 我们会审慎选择第三方服务提供商，但无法完全控制第三方对您个人信息的处理。
          </Text>
        </View>

        {/* 第九条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>九、Cookie和类似技术</Text>
          <Text style={styles.paragraph}>
            9.1 为确保服务正常运行、优化用户体验，我们可能会使用Cookie和类似技术。
          </Text>
          <Text style={styles.paragraph}>
            9.2 您可以通过设备设置管理或删除Cookie。但这可能会影响您使用我们的服务。
          </Text>
        </View>

        {/* 第十条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>十、隐私政策的变更</Text>
          <Text style={styles.paragraph}>
            10.1 我们可能会适时修订本隐私政策。修订后的政策将在本应用中发布。
          </Text>
          <Text style={styles.paragraph}>
            10.2 如变更会导致您的权利受到实质影响，我们会通过显著方式提前通知您。
          </Text>
          <Text style={styles.paragraph}>
            10.3 如您继续使用我们的服务，即表示您同意接受修订后的隐私政策。
          </Text>
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系我们</Text>
          <Text style={styles.paragraph}>
            如您对本隐私政策有任何疑问、意见或建议，或需要行使您的权利，请通过以下方式联系我们：
          </Text>
          <Text style={styles.contactInfo}>
            联系邮箱：zhu.cy@outlook.com
          </Text>
          <Text style={styles.contactInfo}>
            公司地址：广东省深圳市南山区科技园
          </Text>
          <Text style={styles.paragraph}>
            我们会在收到您的请求后15个工作日内给予答复。
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>客满云团队</Text>
          <Text style={styles.footerText}>2025年1月</Text>
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
    padding: Spacings.lg,
  },
  updateInfo: {
    backgroundColor: '#e0e7ff',
    padding: Spacings.md,
    borderRadius: ComponentSizes.borderRadius,
    marginBottom: Spacings.xl,
  },
  updateText: {
    fontSize: FontSizes.small,
    color: '#4f46e5',
    marginBottom: 2,
  },
  welcome: {
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacings.lg,
    textAlign: 'center',
  },
  intro: {
    fontSize: FontSizes.normal,
    color: '#475569',
    lineHeight: 24,
    marginBottom: Spacings.xl,
    textAlign: 'justify',
  },
  section: {
    marginBottom: Spacings.xxl,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacings.md,
  },
  subTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#334155',
    marginTop: Spacings.md,
    marginBottom: Spacings.sm,
  },
  paragraph: {
    fontSize: FontSizes.normal,
    color: '#475569',
    lineHeight: 24,
    marginBottom: Spacings.md,
    textAlign: 'justify',
  },
  listItem: {
    fontSize: FontSizes.normal,
    color: '#475569',
    lineHeight: 24,
    marginBottom: Spacings.sm,
    paddingLeft: Spacings.md,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: '600',
    color: '#1e293b',
  },
  contactInfo: {
    fontSize: FontSizes.normal,
    color: '#6366f1',
    lineHeight: 24,
    marginBottom: Spacings.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacings.xxl,
    marginBottom: Spacings.xl,
  },
  footerText: {
    fontSize: FontSizes.normal,
    color: '#64748b',
    marginBottom: 4,
  },
})

