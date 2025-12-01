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

export default function UserAgreementScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>用户协议</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.updateInfo}>
          <Text style={styles.updateText}>更新日期：2025年1月1日</Text>
          <Text style={styles.updateText}>生效日期：2025年1月1日</Text>
        </View>

        <Text style={styles.welcome}>
          欢迎使用满客云！
        </Text>

        <Text style={styles.intro}>
          在使用满客云（以下简称"本服务"）之前，请您仔细阅读并充分理解本《用户协议》（以下简称"本协议"）。本协议是您与满客云团队（以下简称"我们"）之间关于使用本服务的法律协议。
        </Text>

        {/* 第一条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>一、协议的接受</Text>
          <Text style={styles.paragraph}>
            1.1 当您注册成为满客云用户或使用本服务时，即表示您已充分阅读、理解并同意接受本协议的全部内容。
          </Text>
          <Text style={styles.paragraph}>
            1.2 如果您不同意本协议的任何内容，或无法准确理解我们对条款的解释，请不要进行后续操作。
          </Text>
          <Text style={styles.paragraph}>
            1.3 我们有权根据需要不时修改本协议，修改后的协议将在本服务平台上公布。如您继续使用本服务，即表示您接受修改后的协议。
          </Text>
        </View>

        {/* 第二条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>二、账号注册与使用</Text>
          <Text style={styles.paragraph}>
            2.1 您需要注册一个账号才能使用本服务。在注册时，您应当提供真实、准确、完整的信息。
          </Text>
          <Text style={styles.paragraph}>
            2.2 您应妥善保管您的账号和密码，并对通过您的账号进行的所有活动承担责任。
          </Text>
          <Text style={styles.paragraph}>
            2.3 您不得将账号出售、转让或借给他人使用。如发现账号被盗用或存在其他安全问题，应立即通知我们。
          </Text>
          <Text style={styles.paragraph}>
            2.4 您承诺不会利用本服务进行任何违法、违规或侵犯他人合法权益的行为。
          </Text>
        </View>

        {/* 第三条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>三、服务内容</Text>
          <Text style={styles.paragraph}>
            3.1 本服务为酒店民宿管理系统，提供房态管理、预订管理、客户管理、财务管理等功能。
          </Text>
          <Text style={styles.paragraph}>
            3.2 我们保留随时修改、中断或终止部分或全部服务的权利，无需对您或任何第三方承担责任。
          </Text>
          <Text style={styles.paragraph}>
            3.3 我们将尽力维护服务的稳定性和安全性，但不保证服务不会中断，也不保证服务的及时性、准确性和完整性。
          </Text>
        </View>

        {/* 第四条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>四、用户行为规范</Text>
          <Text style={styles.paragraph}>
            4.1 您在使用本服务时应遵守国家法律法规，不得利用本服务从事以下行为：
          </Text>
          <Text style={styles.listItem}>
            • 发布、传送或存储违法、虚假、骚扰、诽谤、色情或其他违反社会公德的内容
          </Text>
          <Text style={styles.listItem}>
            • 侵犯他人知识产权、商业秘密或其他合法权益
          </Text>
          <Text style={styles.listItem}>
            • 从事任何可能损害、干扰或破坏本服务的行为
          </Text>
          <Text style={styles.listItem}>
            • 利用本服务进行商业竞争或其他商业目的
          </Text>
          <Text style={styles.paragraph}>
            4.2 如违反上述规定，我们有权立即终止您的账号并删除相关内容。
          </Text>
        </View>

        {/* 第五条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>五、知识产权</Text>
          <Text style={styles.paragraph}>
            5.1 本服务的所有内容，包括但不限于文字、图片、软件、程序、界面设计等，其知识产权均归我们所有。
          </Text>
          <Text style={styles.paragraph}>
            5.2 未经我们书面许可，您不得复制、传播、修改、展示或以其他方式使用本服务的任何内容。
          </Text>
          <Text style={styles.paragraph}>
            5.3 您在本服务中上传或发布的内容，您保留其知识产权，但授予我们在本服务范围内使用该内容的权利。
          </Text>
        </View>

        {/* 第六条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>六、隐私保护</Text>
          <Text style={styles.paragraph}>
            6.1 我们重视对您个人信息的保护。关于我们如何收集、使用和保护您的个人信息，请参阅《隐私政策》。
          </Text>
          <Text style={styles.paragraph}>
            6.2 您同意我们按照《隐私政策》的规定收集、使用和披露您的个人信息。
          </Text>
        </View>

        {/* 第七条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>七、数据安全</Text>
          <Text style={styles.paragraph}>
            7.1 我们采取合理的技术和管理措施保护您的数据安全，但无法保证数据的绝对安全。
          </Text>
          <Text style={styles.paragraph}>
            7.2 建议您定期备份重要数据。对于因不可抗力、黑客攻击、系统故障等原因造成的数据丢失，我们不承担责任。
          </Text>
          <Text style={styles.paragraph}>
            7.3 您应对自己账号下的数据负责，我们不对您数据的准确性、完整性或合法性进行审查。
          </Text>
        </View>

        {/* 第八条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>八、免责声明</Text>
          <Text style={styles.paragraph}>
            8.1 本服务仅作为工具提供，我们不对您使用本服务产生的任何直接或间接损失承担责任。
          </Text>
          <Text style={styles.paragraph}>
            8.2 对于因以下原因导致的服务中断或其他缺陷，我们不承担责任：
          </Text>
          <Text style={styles.listItem}>
            • 不可抗力，如自然灾害、战争、罢工等
          </Text>
          <Text style={styles.listItem}>
            • 您的操作不当或您的电脑、移动设备软硬件故障
          </Text>
          <Text style={styles.listItem}>
            • 网络信号不稳定或其他通信故障
          </Text>
          <Text style={styles.listItem}>
            • 第三方服务的问题
          </Text>
        </View>

        {/* 第九条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>九、协议终止</Text>
          <Text style={styles.paragraph}>
            9.1 您可以随时注销账号，终止使用本服务。
          </Text>
          <Text style={styles.paragraph}>
            9.2 如您违反本协议的任何条款，我们有权立即终止您的账号，无需事先通知。
          </Text>
          <Text style={styles.paragraph}>
            9.3 协议终止后，您仍应对使用本服务期间的行为承担责任。
          </Text>
        </View>

        {/* 第十条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>十、法律适用与争议解决</Text>
          <Text style={styles.paragraph}>
            10.1 本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。
          </Text>
          <Text style={styles.paragraph}>
            10.2 如就本协议内容或其执行发生任何争议，双方应友好协商解决；协商不成时，任何一方均可向我们所在地有管辖权的人民法院提起诉讼。
          </Text>
        </View>

        {/* 第十一条 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>十一、其他</Text>
          <Text style={styles.paragraph}>
            11.1 本协议构成您和我们之间关于使用本服务的完整协议。
          </Text>
          <Text style={styles.paragraph}>
            11.2 如本协议的任何条款被认定为无效或不可执行，该条款应在适用法律允许的最大范围内解释，其余条款仍应完全有效。
          </Text>
          <Text style={styles.paragraph}>
            11.3 本协议的标题仅为方便阅读而设，不影响对本协议的理解和解释。
          </Text>
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系我们</Text>
          <Text style={styles.paragraph}>
            如您对本协议有任何疑问，请通过以下方式联系我们：
          </Text>
          <Text style={styles.contactInfo}>
            联系邮箱：zhu.cy@outlook.com
          </Text>
          <Text style={styles.contactInfo}>
            公司地址：广东省深圳市南山区科技园
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>满客云团队</Text>
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

