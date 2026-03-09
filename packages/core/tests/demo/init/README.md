---
permalink: /init/
---

# 模型初始化

## 说明

ModelBase 提供多种方式创建模型实例，支持自动命名转换和类型安全。

## 创建方式

### 方式一：构造函数

```ts
import { Column, ModelBase } from '@model-base/core'

class User extends ModelBase {
  @Column()
  id?: number

  @Column()
  userName?: string
}

// 支持蛇形命名（后端常用格式）
const user = new User({
  id: 1,
  user_name: 'John'
})

// 也支持驼峰命名
const user2 = new User({
  id: 2,
  userName: 'Jane'
})
```

### 方式二：静态 create 方法（推荐）

```ts
const user = User.create({
  id: 1,
  user_name: 'John'
})
```

::: tip 为什么推荐使用 create？
`create` 方法可以避免 TypeScript `useDefineForClassFields` 配置对实例化的影响，确保在各种配置下都能正确工作。
:::

### 方式三：工具函数

```ts
import { createModel, deserialize } from '@model-base/core'

// createModel
const user = createModel(User, { id: 1, user_name: 'John' })

// deserialize（支持惰性加载解决循环依赖）
const user2 = deserialize(User, { id: 2, user_name: 'Jane' })
```

## 初始化选项

```ts
const user = new User(dto, {
  // 不设置默认值
  noDefault: true,
  
  // 启用变更追踪
  enableDataState: true,
  
  // 反序列化命名策略
  deserializeNamingStrategies: 'mix', // 'mix' | 'camelCase' | 'snakeCase'
  
  // 序列化命名策略
  serializeNamingStrategies: 'snakeCase', // 'camelCase' | 'snakeCase'
  
  // 分组过滤
  group: 'create'
})
```

## 注意事项

- 属性必须使用 `@Column()` 装饰器标记，否则不会被序列化
- 默认情况下，反序列化同时支持 `snake_case` 和 `camelCase`
- 默认情况下，序列化输出为 `snake_case` 格式
