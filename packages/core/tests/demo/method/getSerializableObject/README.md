---
permalink: /method/getSerializableObject/
---

# getSerializableObject 序列化

## 说明

将模型实例转换为可序列化的普通对象（DTO），用于提交给后端 API。

## 方法签名

```ts
getSerializableObject(params?: {
  trim?: boolean           // 是否去除字符串首尾空格
  group?: string           // 仅包含指定分组
  excludeGroup?: string    // 排除指定分组
  clean?: CLEAN_ENUM       // 空值清理策略
  camelCase?: boolean      // 是否使用驼峰命名
  enableEmptyValue?: boolean // 是否启用 emptyValue
}): object
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `trim` | `boolean` | `false` | 去除字符串首尾空格 |
| `group` | `string` | - | 仅序列化指定分组的列 |
| `excludeGroup` | `string` | - | 排除指定分组的列 |
| `clean` | `CLEAN_ENUM` | `CLEAN_UNDEFINED_AND_NULL` | 空值清理策略 |
| `camelCase` | `boolean` | `false` | 输出驼峰命名（默认蛇形） |

## 空值清理策略

```ts
import { CLEAN_ENUM } from '@model-base/core'

// 仅清理 undefined
user.getSerializableObject({ clean: CLEAN_ENUM.CLEAN_UNDEFINED })

// 清理 undefined 和 null（默认）
user.getSerializableObject({ clean: CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL })

// 清理所有空值（undefined、null、''、[]、{}）
user.getCleanSerializableObject()
// 或
user.getSerializableObject({ clean: CLEAN_ENUM.CLEAN_DIRTY })
```

## 使用示例

```ts
const user = new User({
  id: 1,
  user_name: 'John',
  email: ''
})

// 默认序列化（蛇形命名）
user.getSerializableObject()
// { id: 1, user_name: 'John', email: '' }

// 驼峰命名
user.getSerializableObject({ camelCase: true })
// { id: 1, userName: 'John', email: '' }

// 清理空值
user.getCleanSerializableObject()
// { id: 1, user_name: 'John' }
```

## 案例

::: tabs

@tab 案例一

### 模型

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#model -->
```

### 实例初始化

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#instance -->
```

### 打印日志

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#log -->
```

:::

## 相关方法

- [`getCleanSerializableObject`](/method/getCleanSerializableObject/) - 获取清理后的序列化对象
- [`getChangedData`](/method/getChangedData/) - 仅获取变更的数据
- [`getSerializableString`](/method/getSerializableString/) - 获取 JSON 字符串
