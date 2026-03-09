---
permalink: /method/isChanged/
---

# isChanged 变更检测

## 说明

检测模型实例相对于上一个保存点是否有数据变更。常用于判断用户是否修改了表单数据。

## 方法签名

```ts
isChanged(params?: {
  group?: string           // 仅检测指定分组
  excludeGroup?: string    // 排除指定分组
  trim?: boolean           // 去除空格后比较
  ignoreEmptyString?: boolean // 忽略空字符串变更
}): boolean
```

## 返回值

| 返回值 | 说明 |
|-------|------|
| `true` | 有变更 |
| `false` | 无变更 |

## 检测范围

只检测使用 `@Column()` 装饰器声明的属性，未声明的属性不参与检测。

## 使用场景

- **表单保存提示**：用户离开页面时提示"有未保存的更改"
- **保存按钮状态**：无变更时禁用保存按钮
- **数据同步检测**：判断本地数据是否与服务端一致

## 使用示例

```ts
const user = new User({ user_name: 'John' })

// 初始状态无变更
user.isChanged() // false

// 修改数据
user.userName = 'Jane'
user.isChanged() // true

// 保存后重置状态
user.saveChangedData()
user.isChanged() // false

// 还原到修改前
user.userName = 'Modified'
user.revertChangedData()
user.isChanged() // false
```

## 与分组配合使用

```ts
class User extends ModelBase {
  @Column({ group: ['basic'] })
  userName?: string

  @Column({ group: ['advanced'] })
  settings?: object
}

// 只检测 basic 分组
user.isChanged({ group: 'basic' })

// 排除 advanced 分组
user.isChanged({ excludeGroup: 'advanced' })
```

## 案例

::: tabs

@tab 案例一
返回 **boolean** 值

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
判断当前对象通过 **@Column** 声明的字段是否变化

### 模型

```ts :no-line-numbers
<!-- @include: ./noColumn.spec.ts#model -->
```

### 实例初始化

```ts :no-line-numbers
<!-- @include: ./noColumn.spec.ts#instance -->
```

### 修改实例

```ts :no-line-numbers
<!-- @include: ./noColumn.spec.ts#change -->
```

### 打印日志

```ts :no-line-numbers
<!-- @include: ./noColumn.spec.ts#log -->
```

:::
