---
permalink: /guide/know/
---

# 基本概念

## 核心术语

### 模型实例 (Model Instance)

继承 `ModelBase` 的类通过 `new` 或 `create()` 创建的实例：

```ts
class User extends ModelBase {
  @Column() userName?: string
}

const user = new User({ user_name: 'John' })  // 模型实例
const user2 = User.create({ user_name: 'Jane' }) // 推荐方式
```

### 反序列化 (Deserialize)

将后端返回的 JSON 数据（DTO）转换为模型实例的过程：

```ts
// 后端返回的 DTO（蛇形命名）
const dto = { user_name: 'John', created_at: '2024-01-01' }

// 反序列化为模型实例
const user = new User(dto)
console.log(user.userName) // 'John' - 驼峰命名
```

### 序列化 (Serialize)

将模型实例转换为可提交给后端的 JSON 对象：

```ts
const user = new User({ user_name: 'John' })

// 序列化为 DTO
user.getSerializableObject() // { user_name: 'John' }
user.getSerializableObject({ camelCase: true }) // { userName: 'John' }
```

## 数据状态与变更追踪

ModelBase 内部维护两个数据状态：

| 状态 | 说明 |
|-----|------|
| **原始数据 (originalData)** | 创建实例或调用 `saveChangedData()` 时的快照 |
| **当前数据 (currentData)** | 实例的当前值 |

### 生命周期示意

```
创建实例 ──────────────────────────────────────────────►
    │                                                    
    ├─ originalData = { name: 'John' }                  
    ├─ currentData  = { name: 'John' }                  
    │                                                    
    │  user.name = 'Jane'                               
    │                                                    
    ├─ originalData = { name: 'John' }  (不变)          
    ├─ currentData  = { name: 'Jane' }  (已变更)        
    │                                                    
    │  user.getChangedData()                            
    │  → { name: 'Jane' }                               
    │                                                    
    │  user.saveChangedData()                           
    │                                                    
    ├─ originalData = { name: 'Jane' }  (更新为当前值)  
    ├─ currentData  = { name: 'Jane' }                  
    │                                                    
    │  user.revertChangedData()                         
    │                                                    
    └─ currentData 还原为 originalData                  
```

## 装饰器概览

### @Column

属性装饰器，标记需要序列化的属性：

```ts
class User extends ModelBase {
  // 基本用法
  @Column()
  userName?: string

  // 主键
  @Column({ primary: true })
  id?: number

  // 指定别名（兼容不同 API 格式）
  @Column({ aliasName: 'nick_name' })
  nickname?: string

  // 默认值
  @Column({ default: 0 })
  age?: number

  // 嵌套模型
  @Column({ model: Address })
  address?: Address

  // 数组模型
  @Column({ model: OrderItem, default: () => [] })
  orders?: OrderItem[]

  // 自定义序列化/反序列化
  @Column({
    deserialize: ({ value }) => new Date(value),
    serialize: ({ value }) => value?.toISOString()
  })
  createdAt?: Date
}
```

### @DataModel

类装饰器，配置模型级别的选项：

```ts
@DataModel({
  enableDataState: true,  // 启用变更追踪
  methods: {
    onInit: ({ data }) => console.log('Initialized:', data)
  }
})
class User extends ModelBase {
  // ...
}
```

## API 概览

### 实例方法

| 方法 | 说明 |
|-----|------|
| `getSerializableObject(options?)` | 获取序列化对象 |
| `getCleanSerializableObject(options?)` | 获取清理后的序列化对象（移除空值） |
| `getChangedData(options?)` | 获取变更的数据 |
| `isChanged(options?)` | 检查是否有变更 |
| `saveChangedData(options?)` | 保存当前状态为新的基准点 |
| `revertChangedData()` | 还原到上一个保存点 |
| `update(dto)` | 增量更新数据 |
| `getOriginalData()` | 获取原始数据 |
| `getPrimaryKey()` | 获取主键配置 |
| `getPrimaryValue()` | 获取主键值 |

### 静态方法

| 方法 | 说明 |
|-----|------|
| `Model.create(dto, options?)` | 创建模型实例（推荐） |
| `Model.revertChangedData(target)` | 还原目标对象的数据 |
| `Model.resetDefault(target)` | 重置为默认值 |

### 工具函数

```ts
import { 
  deserialize,      // 反序列化单个对象
  deserializeArray, // 反序列化数组
  serialize,        // 序列化
  createModel,      // 创建模型实例
  createDynamicModel // 创建动态模型
} from '@model-base/core'
```

## 命名策略

| 策略 | 说明 |
|-----|------|
| `snakeCase` | 蛇形命名：`user_name`（默认序列化策略） |
| `camelCase` | 驼峰命名：`userName` |
| `mix` | 混合模式：反序列化时同时支持两种格式（默认反序列化策略） |

配置示例：

```ts
// 实例级别
const user = new User(dto, {
  serializeNamingStrategies: 'camelCase',
  deserializeNamingStrategies: 'snakeCase'
})

// 类级别
@DataModel({
  serializeNamingStrategies: 'camelCase'
})
class User extends ModelBase { }
```

