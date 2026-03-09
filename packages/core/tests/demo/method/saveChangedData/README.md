---
permalink: /method/saveChangedData/
---

# saveChangedData 保存状态

## 说明

将当前数据状态保存为新的基准点（快照）。调用后：
- `isChanged()` 返回 `false`
- `getChangedData()` 返回 `{}`
- `revertChangedData()` 将恢复到此状态

## 方法签名

```ts
saveChangedData(params?: {
  group?: string           // 仅保存指定分组
  excludeGroup?: string    // 排除指定分组
  enableDataState?: boolean // 是否启用状态保存
}): this
```

## 使用场景

### 场景一：提交成功后重置状态

```ts
const user = new User({ user_name: 'John' })

// 用户修改数据
user.userName = 'Jane'
console.log(user.isChanged()) // true

// 提交成功
await api.updateUser(user.getChangedData())

// 保存新状态
user.saveChangedData()
console.log(user.isChanged()) // false
```

### 场景二：异步数据初始化

```ts
const form = new FormModel({})

// 异步获取表单初始值
const data = await api.getFormData()
form.update(data)

// 将异步数据作为初始状态（不视为"变更"）
form.saveChangedData()

// 此时 isChanged() 为 false
// 用户后续修改才会被检测为变更
```

### 场景三：分步骤保存

```ts
// 第一步完成
user.userName = 'Step 1 Value'
user.saveChangedData()

// 第二步修改
user.email = 'step2@test.com'

// 仅获取第二步的变更
user.getChangedData() // { email: 'step2@test.com' }
```

## 与分组配合使用

```ts
// 仅保存 basic 分组的状态
user.saveChangedData({ group: 'basic' })

// 排除 temp 分组（临时数据不保存状态）
user.saveChangedData({ excludeGroup: 'temp' })
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

### 修改实例

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#change -->
```

### 调用函数

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#fn -->
```

### 打印日志

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#log -->
```

:::
