---
permalink: /method/getChangedData/
---

# getChangedData 获取变更数据

## 说明

获取模型实例相对于上一个保存点的变更数据。用于实现增量提交，只提交用户修改过的字段。

## 方法签名

```ts
getChangedData(params?: {
  group?: string            // 仅包含指定分组
  excludeGroup?: string     // 排除指定分组
  trim?: boolean            // 是否去除字符串首尾空格后比较
  clean?: CLEAN_ENUM        // 空值清理策略
  ignoreEmptyString?: boolean // 忽略空字符串变更
  enableEmptyValue?: boolean  // 是否使用 emptyValue 替代空值
}): object
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `group` | `string` | - | 仅检测指定分组的列 |
| `excludeGroup` | `string` | - | 排除指定分组的列 |
| `trim` | `boolean` | `false` | 去除空格后比较 |
| `ignoreEmptyString` | `boolean` | `false` | `undefined` 变为 `''` 视为无变化 |

## 工作原理

```
创建实例 → 保存初始快照
    ↓
修改属性
    ↓
getChangedData() → 对比当前值与快照，返回差异
    ↓
saveChangedData() → 更新快照为当前值
```

## 使用示例

```ts
// 创建实例（自动保存初始快照）
const user = new User({
  id: 1,
  user_name: 'John',
  email: 'john@test.com'
})

// 用户修改数据
user.userName = 'Jane'
user.email = 'jane@test.com'

// 获取变更
user.getChangedData()
// { user_name: 'Jane', email: 'jane@test.com' }

// 检查是否有变更
user.isChanged() // true

// 提交后保存新的快照
await api.updateUser(user.getChangedData())
user.saveChangedData()

// 再次获取变更（已无变更）
user.getChangedData() // {}
user.isChanged() // false
```

## 使用场景

- **表单提交**：只提交用户修改的字段，减少数据传输
- **变更检测**：判断用户是否修改了数据，提示保存
- **审计日志**：记录用户修改了哪些字段

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

### 修改数据

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#change -->
```

### 打印日志

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#log -->
```

:::

## 相关方法

- [`isChanged`](/method/isChanged/) - 检查是否有变更
- [`saveChangedData`](/method/saveChangedData/) - 保存当前状态
- [`revertChangedData`](/method/revertChangedData/) - 还原到保存点
- [`getChangedDescriptor`](/method/getChangedDescriptor/) - 获取详细变更描述
