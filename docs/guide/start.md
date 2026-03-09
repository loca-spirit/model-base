---
permalink: /guide/start/
---

# 快速上手

## 安装

::: code-tabs#shell

@tab npm

```bash
npm install @model-base/core
```

@tab yarn

```bash
yarn add @model-base/core
```

@tab pnpm

```bash
pnpm add @model-base/core
```

:::

## 配置 TypeScript

在 `tsconfig.json` 中添加以下配置：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

::: tip 提示
- `experimentalDecorators`: 启用装饰器语法（同时支持新版 TypeScript 5.0+ 装饰器）
- `useDefineForClassFields`: 必须设置为 `false`，否则会导致属性值为 `undefined`
:::

## 定义模型

使用 `@Column` 装饰器标记需要序列化的属性：

```ts
import { Column, ModelBase } from '@model-base/core'

export class User extends ModelBase {
  @Column({ primary: true })
  id?: number

  @Column()
  userName?: string

  @Column()
  email?: string
}
```

## 创建实例

支持多种方式创建模型实例：

::: code-tabs

@tab 构造函数

```ts
// 支持蛇形命名（后端常用格式）
const user = new User({
  id: 1,
  user_name: 'John',
  email: 'john@example.com'
})

// 也支持驼峰命名
const user2 = new User({
  id: 2,
  userName: 'Jane',
  email: 'jane@example.com'
})
```

@tab 静态方法

```ts
// 推荐方式：使用 create 静态方法
const user = User.create({
  id: 1,
  user_name: 'John',
  email: 'john@example.com'
})
```

:::

## 序列化

将模型实例转换为普通对象，用于提交给后端 API：

```ts
// 获取序列化对象（默认蛇形命名）
user.getSerializableObject()
// { id: 1, user_name: 'John', email: 'john@example.com' }

// 获取驼峰命名的对象
user.getSerializableObject({ camelCase: true })
// { id: 1, userName: 'John', email: 'john@example.com' }

// 获取清理后的对象（移除空字符串、空数组、空对象）
user.getCleanSerializableObject()
```

## 变更追踪

ModelBase 自动追踪数据变化，方便实现增量提交：

```ts
const user = new User({ id: 1, user_name: 'John' })

// 修改数据
user.userName = 'Jane'
user.email = 'jane@example.com'

// 获取变更的数据
user.getChangedData()
// { user_name: 'Jane', email: 'jane@example.com' }

// 检查是否有变更
user.isChanged() // true

// 还原到初始状态
user.revertChangedData()

// 保存当前状态为新的基准点
user.saveChangedData()
```

## 下一步

- [为什么选择 ModelBase](/guide/why/) - 了解 ModelBase 解决的问题
- [基本概念](/guide/know/) - 深入理解核心概念
- [@Column 装饰器](/column/default/) - 了解列配置选项
- [实例方法](/method/getSerializableObject/) - 查看所有可用方法
