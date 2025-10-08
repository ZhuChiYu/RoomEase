/**
 * 移动端API测试脚本
 * 测试移动端与后端API的连接
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000';

// 测试数据
const testUser = {
  email: 'admin@demo.com',
  password: '123456'
};

let accessToken = '';
let propertyId = 'demo-property';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// 测试函数
async function testAPI() {
  try {
    log('\n🧪 开始测试移动端API集成\n', 'blue');

    // 1. 测试登录
    log('1️⃣  测试登录接口...', 'yellow');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    accessToken = loginResponse.data.accessToken;
    log(`✅ 登录成功!`, 'green');
    log(`   用户: ${loginResponse.data.user.name} (${loginResponse.data.user.email})`);
    log(`   角色: ${loginResponse.data.user.role}`);
    log(`   Token: ${accessToken.substring(0, 50)}...`);

    // 配置axios默认header
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // 2. 测试获取用户信息
    log('\n2️⃣  测试获取用户信息...', 'yellow');
    const profileResponse = await api.get('/auth/profile');
    log(`✅ 获取用户信息成功!`, 'green');
    log(`   用户: ${profileResponse.data.name}`);

    // 3. 测试获取房间列表
    log('\n3️⃣  测试获取房间列表...', 'yellow');
    const roomsResponse = await api.get(`/rooms?propertyId=${propertyId}`);
    log(`✅ 获取房间列表成功!`, 'green');
    log(`   房间数量: ${roomsResponse.data.length}`);
    if (roomsResponse.data.length > 0) {
      const room = roomsResponse.data[0];
      log(`   示例房间: ${room.name} (${room.code}) - ¥${room.basePrice}`);
    }

    // 4. 测试获取预订列表
    log('\n4️⃣  测试获取预订列表...', 'yellow');
    const reservationsResponse = await api.get(`/reservations?propertyId=${propertyId}`);
    log(`✅ 获取预订列表成功!`, 'green');
    log(`   预订数量: ${reservationsResponse.data.length}`);
    if (reservationsResponse.data.length > 0) {
      const reservation = reservationsResponse.data[0];
      log(`   示例预订: ${reservation.guestName} - ${reservation.status}`);
    }

    // 5. 测试获取日历数据
    log('\n5️⃣  测试获取日历数据...', 'yellow');
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const calendarResponse = await api.get('/calendar', {
      params: {
        propertyId,
        startDate: today.toISOString().split('T')[0],
        endDate: nextMonth.toISOString().split('T')[0]
      }
    });
    log(`✅ 获取日历数据成功!`, 'green');
    log(`   房间数: ${calendarResponse.data.rooms?.length || 0}`);
    log(`   预订数: ${calendarResponse.data.reservations?.length || 0}`);

    // 6. 测试获取统计数据
    log('\n6️⃣  测试获取统计数据...', 'yellow');
    const dashboardResponse = await api.get('/analytics/dashboard', {
      params: { propertyId }
    });
    log(`✅ 获取统计数据成功!`, 'green');
    log(`   总房间数: ${dashboardResponse.data.totalRooms}`);
    log(`   入住率: ${dashboardResponse.data.occupancyRate}%`);
    log(`   今日收入: ¥${dashboardResponse.data.todayRevenue}`);

    // 7. 测试创建预订
    log('\n7️⃣  测试创建预订...', 'yellow');
    const rooms = roomsResponse.data;
    if (rooms.length > 0) {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 5);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      const newReservation = {
        propertyId,
        roomId: rooms[0].id,
        checkInDate: checkInDate.toISOString().split('T')[0],
        checkOutDate: checkOutDate.toISOString().split('T')[0],
        guestName: '测试客人',
        guestPhone: '13800138000',
        guestCount: 2,
        childCount: 0,
        roomRate: parseFloat(rooms[0].basePrice),
        totalAmount: parseFloat(rooms[0].basePrice) * 2
      };

      try {
        const createResponse = await api.post('/reservations', newReservation);
        log(`✅ 创建预订成功!`, 'green');
        log(`   预订ID: ${createResponse.data.id}`);
        log(`   客人: ${createResponse.data.guestName}`);
        log(`   房间: ${rooms[0].name}`);
        log(`   日期: ${newReservation.checkInDate} 至 ${newReservation.checkOutDate}`);
        log(`   总价: ¥${createResponse.data.totalAmount}`);
      } catch (error) {
        if (error.response?.data?.message?.includes('已被预订')) {
          log(`⚠️  房间已被预订（这是正常的）`, 'yellow');
        } else {
          throw error;
        }
      }
    }

    log('\n✅ 所有API测试完成!', 'green');
    log('\n📱 移动端可以正常使用后端API!', 'blue');
    
    // 输出配置信息
    log('\n📋 移动端配置信息:', 'blue');
    log('   API地址: http://localhost:4000');
    log('   测试账号: admin@demo.com');
    log('   测试密码: 123456');
    log('   物业ID: demo-property');

  } catch (error) {
    log(`\n❌ 测试失败: ${error.message}`, 'red');
    if (error.response) {
      log(`   状态码: ${error.response.status}`, 'red');
      log(`   错误信息: ${JSON.stringify(error.response.data)}`, 'red');
    }
    process.exit(1);
  }
}

// 运行测试
testAPI();

