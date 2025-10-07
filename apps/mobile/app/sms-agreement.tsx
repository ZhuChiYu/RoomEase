import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'

export default function SMSAgreementScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>短信协议</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>短信服务协议</Text>
          
          <Text style={styles.text}>
            欢迎使用RoomEase短信服务！
          </Text>

          <Text style={styles.subtitle}>第一条 协议的接受</Text>
          <Text style={styles.text}>
            1.1 本协议是您与RoomEase之间关于使用短信服务的法律协议。{'\n'}
            1.2 使用本服务即表示您已阅读、理解并同意接受本协议的全部内容。{'\n'}
            1.3 RoomEase有权在必要时修改本协议条款，修改后的协议将在平台公布。
          </Text>

          <Text style={styles.subtitle}>第二条 服务说明</Text>
          <Text style={styles.text}>
            2.1 RoomEase短信服务是为酒店、民宿等住宿业提供的客户通知服务。{'\n'}
            2.2 服务内容包括但不限于：预订确认、入住提醒、退房通知、支付提醒等。{'\n'}
            2.3 短信发送成功率受运营商网络、用户手机状态等因素影响，不保证100%送达。
          </Text>

          <Text style={styles.subtitle}>第三条 用户义务</Text>
          <Text style={styles.text}>
            3.1 您应确保发送内容真实、合法，不侵犯他人合法权益。{'\n'}
            3.2 您应妥善保管账户信息，对账户下的所有行为负责。{'\n'}
            3.3 您不得利用本服务发送垃圾信息、广告或其他违法违规内容。{'\n'}
            3.4 您应遵守《中华人民共和国网络安全法》等相关法律法规。
          </Text>

          <Text style={styles.subtitle}>第四条 费用说明</Text>
          <Text style={styles.text}>
            4.1 短信服务按实际发送条数计费。{'\n'}
            4.2 具体资费标准以平台公布的价格为准。{'\n'}
            4.3 充值后的余额不可提现，仅可用于支付短信费用。{'\n'}
            4.4 如因您违规使用导致的损失，费用不予退还。
          </Text>

          <Text style={styles.subtitle}>第五条 隐私保护</Text>
          <Text style={styles.text}>
            5.1 我们重视用户隐私保护，严格遵守相关法律法规。{'\n'}
            5.2 未经用户同意，不会向第三方披露用户信息。{'\n'}
            5.3 我们采用加密技术保护数据传输安全。{'\n'}
            5.4 用户有权查询、修改或删除个人信息。
          </Text>

          <Text style={styles.subtitle}>第六条 免责声明</Text>
          <Text style={styles.text}>
            6.1 因不可抗力导致的服务中断，我们不承担责任。{'\n'}
            6.2 因第三方（运营商）原因导致的短信延迟或失败，我们不承担责任。{'\n'}
            6.3 用户因违规使用服务导致的一切后果，由用户自行承担。{'\n'}
            6.4 我们保留暂停或终止违规用户服务的权利。
          </Text>

          <Text style={styles.subtitle}>第七条 争议解决</Text>
          <Text style={styles.text}>
            7.1 本协议的解释、效力及纠纷解决，适用中华人民共和国法律。{'\n'}
            7.2 如发生争议，双方应友好协商解决。{'\n'}
            7.3 协商不成的，任何一方可向RoomEase所在地人民法院提起诉讼。
          </Text>

          <Text style={styles.subtitle}>第八条 其他</Text>
          <Text style={styles.text}>
            8.1 本协议自用户勾选同意并开始使用服务时生效。{'\n'}
            8.2 本协议的任何条款无论因何种原因无效或不具可执行性，其余条款仍有效。{'\n'}
            8.3 RoomEase对本协议拥有最终解释权。
          </Text>

          <Text style={styles.footer}>
            {'\n'}如有疑问，请联系客服：400-888-8888{'\n'}
            生效日期：2025年1月1日
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 12,
    backgroundColor: '#5b7ce6',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
  },
  footer: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
})

