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

export default function SMSRulesScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>短信内容规则</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>短信发送规则</Text>
          
          <Text style={styles.subtitle}>一、内容要求</Text>
          <Text style={styles.text}>
            1. 短信内容必须真实、合法，不得包含违法违规信息{'\n'}
            2. 禁止发送垃圾广告、诈骗信息{'\n'}
            3. 必须包含有效的退订方式{'\n'}
            4. 不得冒用他人名义发送短信
          </Text>

          <Text style={styles.subtitle}>二、计费规则</Text>
          <Text style={styles.text}>
            1. 短信按条数计费，70字（含签名）为1条{'\n'}
            2. 超过70字，每67字为1条{'\n'}
            3. 短信签名和内容均计入字数{'\n'}
            4. 标点符号、空格、数字、字母均计入字数
          </Text>

          <Text style={styles.subtitle}>三、发送时间</Text>
          <Text style={styles.text}>
            1. 营销类短信发送时间：8:00-21:00{'\n'}
            2. 通知类短信可全天发送{'\n'}
            3. 避免在深夜或凌晨发送，以免打扰客户
          </Text>

          <Text style={styles.subtitle}>四、签名要求</Text>
          <Text style={styles.text}>
            1. 必须使用已审核通过的签名{'\n'}
            2. 签名需与实际业务相符{'\n'}
            3. 签名位于短信开头，格式为【签名】{'\n'}
            4. 不得冒用他人签名
          </Text>

          <Text style={styles.subtitle}>五、禁止内容</Text>
          <Text style={styles.text}>
            禁止发送以下内容：{'\n'}
            • 涉及政治、宗教、色情等敏感信息{'\n'}
            • 诈骗、赌博、传销等违法信息{'\n'}
            • 虚假广告、夸大宣传{'\n'}
            • 侵犯他人隐私的信息{'\n'}
            • 其他违反法律法规的内容
          </Text>

          <Text style={styles.subtitle}>六、违规处理</Text>
          <Text style={styles.text}>
            1. 首次违规：警告并暂停发送功能24小时{'\n'}
            2. 二次违规：暂停发送功能7天{'\n'}
            3. 三次违规：永久停止短信服务{'\n'}
            4. 严重违规：将依法追究法律责任
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
})

