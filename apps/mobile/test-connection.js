#!/usr/bin/env node

/**
 * 服务器连接测试脚本
 * 用于验证移动端是否能正常连接到API服务器
 */

const http = require('http');

// 颜色定义
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 从环境配置读取API地址
// 默认使用生产服务器地址，可通过 API_URL 环境变量覆盖
const API_BASE_URL = process.env.API_URL || 'http://111.230.110.95:4000';

console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.cyan}🔌 移动端API连接测试${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

console.log(`📍 测试服务器: ${colors.yellow}${API_BASE_URL}${colors.reset}\n`);

// 解析URL
const url = new URL(API_BASE_URL);

/**
 * 测试服务器健康检查端点
 */
function testHealthEndpoint() {
  return new Promise((resolve) => {
    console.log(`${colors.blue}[1/3]${colors.reset} 测试 /health 端点...`);
    
    const startTime = Date.now();
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: '/health',
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'KemanCloud-Mobile-Test',
      },
    };

    const req = http.request(options, (res) => {
      const duration = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`  ${colors.green}✓${colors.reset} 健康检查成功 (${duration}ms)`);
          try {
            const json = JSON.parse(data);
            console.log(`  ${colors.cyan}响应:${colors.reset} ${JSON.stringify(json, null, 2).split('\n').join('\n  ')}`);
          } catch (e) {
            console.log(`  ${colors.cyan}响应:${colors.reset} ${data}`);
          }
          resolve({ success: true, duration, status: res.statusCode });
        } else {
          console.log(`  ${colors.red}✗${colors.reset} 状态码错误: ${res.statusCode}`);
          resolve({ success: false, error: `状态码: ${res.statusCode}` });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`  ${colors.red}✗${colors.reset} 连接失败: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`  ${colors.red}✗${colors.reset} 连接超时 (5秒)`);
      resolve({ success: false, error: '连接超时' });
    });

    req.end();
  });
}

/**
 * 测试根路径
 */
function testRootEndpoint() {
  return new Promise((resolve) => {
    console.log(`\n${colors.blue}[2/3]${colors.reset} 测试根路径 /...`);
    
    const startTime = Date.now();
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: '/',
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'KemanCloud-Mobile-Test',
      },
    };

    const req = http.request(options, (res) => {
      const duration = Date.now() - startTime;
      
      res.on('data', () => {}); // 消费数据但不处理
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log(`  ${colors.green}✓${colors.reset} 服务器响应正常 (${duration}ms, 状态码: ${res.statusCode})`);
          resolve({ success: true, duration, status: res.statusCode });
        } else {
          console.log(`  ${colors.yellow}!${colors.reset} 状态码: ${res.statusCode}`);
          resolve({ success: true, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`  ${colors.red}✗${colors.reset} 连接失败: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`  ${colors.red}✗${colors.reset} 连接超时 (5秒)`);
      resolve({ success: false, error: '连接超时' });
    });

    req.end();
  });
}

/**
 * 网络诊断
 */
function networkDiagnostics() {
  console.log(`\n${colors.blue}[3/3]${colors.reset} 网络诊断...`);
  
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log(`  ${colors.cyan}本地网络接口:${colors.reset}`);
  
  for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    const ipv4 = interfaces.find(i => i.family === 'IPv4' && !i.internal);
    if (ipv4) {
      console.log(`    ${name}: ${colors.yellow}${ipv4.address}${colors.reset}`);
    }
  }
  
  console.log(`\n  ${colors.cyan}目标服务器:${colors.reset}`);
  console.log(`    主机: ${colors.yellow}${url.hostname}${colors.reset}`);
  console.log(`    端口: ${colors.yellow}${url.port || 80}${colors.reset}`);
}

/**
 * 主测试函数
 */
async function runTests() {
  try {
    // 测试健康检查端点
    const healthResult = await testHealthEndpoint();
    
    // 测试根路径
    const rootResult = await testRootEndpoint();
    
    // 网络诊断
    networkDiagnostics();
    
    // 总结
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}📊 测试结果总结${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    if (healthResult.success) {
      console.log(`${colors.green}✅ 服务器连接正常${colors.reset}`);
      console.log(`   移动端应该能够正常连接到API服务器\n`);
      
      console.log(`${colors.cyan}📱 在移动端验证:${colors.reset}`);
      console.log(`   1. 打开应用的"开发者"标签页`);
      console.log(`   2. 切换到"服务器API模式"`);
      console.log(`   3. 查看连接状态应该显示"已连接"`);
      console.log(`   4. 点击"测试服务器连接"按钮验证\n`);
      
      console.log(`${colors.cyan}💡 提示:${colors.reset}`);
      console.log(`   - 确保移动设备与电脑在同一WiFi网络`);
      console.log(`   - API地址: ${colors.yellow}${API_BASE_URL}${colors.reset}`);
      console.log(`   - 响应时间: ${colors.yellow}${healthResult.duration}ms${colors.reset}\n`);
      
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ 服务器连接失败${colors.reset}`);
      console.log(`   移动端将无法连接到API服务器\n`);
      
      console.log(`${colors.cyan}🔧 解决方法:${colors.reset}`);
      console.log(`   1. 检查API服务器是否正在运行:`);
      console.log(`      ${colors.yellow}cd /path/to/RoomEase${colors.reset}`);
      console.log(`      ${colors.yellow}./start-backend.sh${colors.reset}\n`);
      
      console.log(`   2. 检查防火墙设置:`);
      console.log(`      确保端口 ${colors.yellow}${url.port || 80}${colors.reset} 未被防火墙阻止\n`);
      
      console.log(`   3. 检查网络连接:`);
      console.log(`      确保设备能够访问 ${colors.yellow}${url.hostname}${colors.reset}\n`);
      
      console.log(`   4. 更新API配置:`);
      console.log(`      编辑 ${colors.yellow}apps/mobile/app/config/environment.ts${colors.reset}`);
      console.log(`      修改 ${colors.yellow}BASE_URL${colors.reset} 为正确的服务器地址\n`);
      
      console.log(`${colors.yellow}错误详情:${colors.reset} ${healthResult.error}\n`);
      
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n${colors.red}测试过程出错:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();

