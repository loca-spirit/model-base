---
permalink: /guide/why/
---

# 为什么选择 ModelBase

## 简介

**ModelBase** 是一个轻量级的 TypeScript 数据模型库，专为前后端数据交互而设计。它通过装饰器语法提供优雅的数据序列化、反序列化和变更追踪能力。

## 核心特性

| 特性 | 说明 |
|-----|------|
| 🔄 **自动命名转换** | 自动处理 `snake_case` ↔ `camelCase` 转换 |
| 📝 **类型安全** | 完整的 TypeScript 支持，享受 IDE 智能提示 |
| 🔍 **变更追踪** | 自动追踪数据变化，支持增量提交和数据还原 |
| 🎯 **装饰器语法** | 使用 `@Column` 声明式定义模型属性 |
| 🏗️ **嵌套模型** | 支持复杂的嵌套对象和数组结构 |
| ⚡ **Vue 兼容** | 完美支持 Vue 2/3 响应式系统 |

## 解决的痛点

### 1. 命名风格转换

后端 API 通常返回 `snake_case` 格式，前端习惯使用 `camelCase`：

```ts
// 后端返回
{ user_name: 'John', created_at: '2024-01-01' }

// 前端期望
{ userName: 'John', createdAt: '2024-01-01' }
```

**ModelBase 方案：** 自动双向转换，无需手动处理

```ts
class User extends ModelBase {
  @Column() userName?: string
  @Column() createdAt?: string
}

const user = new User({ user_name: 'John', created_at: '2024-01-01' })
console.log(user.userName) // 'John' ✅
user.getSerializableObject() // { user_name: 'John', created_at: '...' } ✅
```

### 2. 增量数据提交

表单编辑时，只需提交变更的字段：

```ts
const user = new User({ id: 1, user_name: 'John', email: 'john@test.com' })

// 用户只修改了邮箱
user.email = 'new@test.com'

// 只获取变更的数据
user.getChangedData() // { email: 'new@test.com' }
```

### 3. 空值处理

提交时自动过滤 `undefined`、`null`、空字符串等：

```ts
user.getCleanSerializableObject()
// 自动移除空值、空数组、空对象
```

### 4. 复杂嵌套结构

处理包含子对象、数组的复杂数据：

```ts
class Order extends ModelBase {
  @Column({ primary: true })
  id?: number

  @Column({ model: OrderItem })
  items?: OrderItem[]

  @Column({ model: Address })
  address?: Address
}

// 自动递归创建嵌套模型实例
const order = new Order(apiResponse)
order.items[0].productName // 类型安全 ✅
```

### 5. 数据还原

撤销用户的修改，恢复到初始状态：

```ts
const user = new User({ user_name: 'John' })
user.userName = 'Modified'

// 还原到初始状态
user.revertChangedData()
console.log(user.userName) // 'John'
```

## 适用场景

- 📋 **表单处理**：编辑、提交、撤销、变更检测
- 🔗 **API 交互**：请求/响应数据转换
- 📊 **数据管理**：复杂业务对象的状态管理
- 🎨 **前端应用**：Vue、React 等框架的数据层

## 与其他方案对比

| 特性 | ModelBase | 手动处理 | class-transformer |
|-----|-----------|---------|-------------------|
| 命名转换 | ✅ 自动 | ❌ 手动 | ✅ 需配置 |
| 变更追踪 | ✅ 内置 | ❌ 无 | ❌ 无 |
| 数据还原 | ✅ 内置 | ❌ 无 | ❌ 无 |
| Vue 兼容 | ✅ 完美 | ✅ 取决于实现 | ⚠️ 需额外处理 |
| 学习成本 | 低 | 低 | 中 |
