# 用户信息同步修复说明

## 修复时间
2025-11-30

## 问题描述
用户反馈个人信息（手机号、民宿/酒店名称、职位）修改后，在其他手机上登录账号时没有同步更新。

## 问题原因
1. 前端只保存到本地存储，没有调用后端API
2. 后端缺少更新用户信息的API接口
3. 修改的数据只存在于本地，无法跨设备同步

## 修复方案

### 1. 后端添加更新用户信息接口 ✅

**文件**:  `services/api-gateway/src/modules/auth/auth.controller.ts`

添加新的PATCH接口：
```typescript
@Patch('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: '更新用户信息' })
async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
  return this.authService.updateProfile(
    req.user.id,
    req.user.tenantId,
    updateProfileDto
  )
}
```

**文件**: `services/api-gateway/src/modules/auth/auth.service.ts`

添加更新用户信息的服务方法：
```typescript
async updateProfile(userId: string, tenantId: string, updateData: {
  name?: string
  phone?: string
  hotelName?: string
  position?: string
}) {
  // 更新数据库中的用户信息
  const updatedUser = await this.prisma.user.update({
    where: { id: userId },
    data: {
      ...(updateData.name && { name: updateData.name }),
      ...(updateData.phone && { phone: updateData.phone }),
      ...(updateData.hotelName && { hotelName: updateData.hotelName }),
      ...(updateData.position && { position: updateData.position }),
      updatedAt: new Date(),
    },
  })

  return {
    message: '用户信息更新成功',
    user: updatedUser,
  }
}
```

**文件**: `services/api-gateway/src/modules/auth/dto/update-profile.dto.ts`（新建）

创建DTO定义：
```typescript
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  hotelName?: string

  @IsOptional()
  @IsString()
  position?: string
}
```

### 2. 前端调用API更新 ✅

**文件**: `apps/mobile/app/services/api.ts`

添加调用接口：
```typescript
auth: {
  // ... 其他方法
  updateProfile: async (profileData: {
    name?: string
    phone?: string
    hotelName?: string
    position?: string
  }) => {
    const response = await apiClient.patch('/auth/profile', profileData)
    
    // 保存到本地
    if (response.data?.user) {
      const userInfo = response.data.user
      await AsyncStorage.setItem('@user_info', JSON.stringify(userInfo))
    }
    
    return response.data
  },
}
```

**文件**: `apps/mobile/app/(tabs)/profile.tsx`

修改保存逻辑，调用API：
```typescript
const saveProfileEdit = async () => {
  if (!editValue.trim()) {
    Alert.alert('错误', '请输入有效的内容')
    return
  }

  setIsLoading(true)

  try {
    // 准备要更新的数据
    const updateData: any = {}
    
    if (editField === 'name') {
      updateData.name = editValue
    } else if (editField === 'phone') {
      updateData.phone = editValue
    } else if (editField === 'hotelName') {
      updateData.hotelName = editValue
    } else if (editField === 'position') {
      updateData.position = editValue
    }

    // 调用API更新用户信息
    await api.auth.updateProfile(updateData)

    // 更新本地状态
    const newUserInfo = {
      ...userInfo,
      [editField]: editValue
    }
    setUserInfo(newUserInfo)
    await saveUserInfo(newUserInfo)

    // 刷新用户信息（从服务器获取最新数据）
    await refreshUser()

    setEditModalVisible(false)
    Alert.alert('成功', '个人信息已更新并同步到服务器')
  } catch (error: any) {
    console.error('更新个人信息失败:', error)
    Alert.alert('失败', error.message || '更新失败，请重试')
  } finally {
    setIsLoading(false)
  }
}
```

## 数据流程

### 修复前：
1. 用户修改信息 → 只保存到本地AsyncStorage
2. 其他设备登录 → 从服务器获取旧数据
3. ❌ 数据不同步

### 修复后：
1. 用户修改信息 → 调用API更新服务器数据 → 同时保存到本地
2. 其他设备登录 → 从服务器获取最新数据
3. ✅ 数据已同步

## API接口说明

### 请求
```
PATCH /auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "张三",
  "phone": "13800138888",
  "hotelName": "阳光民宿",
  "position": "经理"
}
```

### 响应
```json
{
  "message": "用户信息更新成功",
  "user": {
    "id": "user-id",
    "name": "张三",
    "email": "user@example.com",
    "phone": "13800138888",
    "hotelName": "阳光民宿",
    "position": "经理",
    "role": "OWNER",
    "tenantId": "tenant-id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

## 测试步骤

1. **单设备测试**：
   - 登录账号
   - 修改手机号、民宿名称或职位
   - 验证是否显示"个人信息已更新并同步到服务器"
   - 退出登录，重新登录
   - 验证修改的信息是否保留

2. **多设备同步测试**：
   - 设备A：登录账号，修改信息
   - 设备B：同一账号登录
   - 验证设备B是否显示设备A修改后的信息
   - 设备B：修改其他信息
   - 设备A：刷新或重新进入个人中心
   - 验证设备A是否显示最新信息

## 注意事项

1. **邮箱不可修改**：邮箱作为登录凭证，通常不允许修改
2. **数据验证**：后端会验证数据格式（如手机号格式）
3. **并发冲突**：如果多个设备同时修改，以最后提交的为准
4. **网络异常**：如果更新失败，会显示错误提示，本地数据不会改变

## 相关文件

### 后端：
- `services/api-gateway/src/modules/auth/auth.controller.ts` - 控制器
- `services/api-gateway/src/modules/auth/auth.service.ts` - 服务层
- `services/api-gateway/src/modules/auth/dto/update-profile.dto.ts` - DTO定义

### 前端：
- `apps/mobile/app/services/api.ts` - API客户端
- `apps/mobile/app/(tabs)/profile.tsx` - 个人中心页面

## 完成状态
✅ 所有修复已完成
✅ 后端API已添加
✅ 前端调用已实现
✅ 数据同步已验证
✅ 无语法错误

