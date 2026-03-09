---
permalink: /method/revertChangedData/
---

# revertChangedData 数据还原

## 说明

将模型数据还原到上一个保存点的状态。保存点在以下时机创建：
1. 实例初始化时
2. 调用 `saveChangedData()` 时

## 方法签名

```ts
// 实例方法
revertChangedData(): this

// 静态方法（支持批量操作）
ModelBase.revertChangedData(
  target: ModelBase | ModelBase[] | { [key: string]: ModelBase }
): void
```

## 使用场景

- **取消编辑**：用户点击取消按钮，恢复到编辑前的状态
- **表单重置**：重置表单到初始值
- **撤销操作**：实现简单的撤销功能

## 使用示例

```ts
const user = new User({
  user_name: 'John',
  email: 'john@test.com'
})

// 用户修改数据
user.userName = 'Jane'
user.email = 'jane@test.com'

// 用户点击"取消"
user.revertChangedData()

// 恢复到初始状态
console.log(user.userName) // 'John'
console.log(user.email)    // 'john@test.com'
```

## 配合 saveChangedData 使用

```ts
const user = new User({ user_name: 'John' })

// 第一次修改并保存
user.userName = 'Jane'
user.saveChangedData() // 新的保存点

// 第二次修改
user.userName = 'Alice'

// 还原到上一个保存点（Jane，而非 John）
user.revertChangedData()
console.log(user.userName) // 'Jane'
```

## 批量还原

```ts
// 还原数组中的所有模型
const users = [user1, user2, user3]
ModelBase.revertChangedData(users)

// 还原对象映射中的所有模型
const userMap = { admin: adminUser, guest: guestUser }
ModelBase.revertChangedData(userMap)
```

## 案例

::: tabs

@tab 案例一
还原数据到初始化

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

### 打印日志

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#log -->
```

@tab 案例二
还原数据到上一次调用 **saveChangedData**

### 模型

```ts :no-line-numbers
<!-- @include: ./save.spec.ts#model -->
```

### 实例初始化

```ts :no-line-numbers
<!-- @include: ./save.spec.ts#instance -->
```

### 修改实例

```ts :no-line-numbers
<!-- @include: ./save.spec.ts#change -->
```

### 调用函数

```ts :no-line-numbers
<!-- @include: ./save.spec.ts#fn -->
```

### 打印日志

```ts :no-line-numbers
<!-- @include: ./save.spec.ts#log -->
```

:::
