---
permalink: /column/autowired/
---

# autowired 自动初始化

## 说明

`autowired` 用于自动初始化**单个嵌套模型对象**。当 DTO 中没有对应数据时，会自动创建一个空的模型实例。

::: warning 适用范围
`autowired` **仅对单个嵌套对象有效**，不适用于：
- 数组类型（请使用 `default: () => []`）
- 普通类型（请使用 `default`）
:::

## 配置

| 参数 | 类型 | 说明 |
|-----|------|------|
| `autowired` | `boolean` | 是否自动初始化，**仅对单个嵌套对象有效** |
| `model` | `Class \| () => Class` | 嵌套模型类型，必须配合 `autowired` 使用 |

## 使用场景

- 表单编辑时，需要确保嵌套对象存在
- 避免访问嵌套属性时出现 `undefined` 错误

## 正确用法

```ts
class Order extends ModelBase {
  // ✅ 正确：单个嵌套对象使用 autowired
  @Column({ model: Address, autowired: true })
  address?: Address

  // ✅ 正确：数组使用 default
  @Column({ model: OrderItem, default: () => [] })
  items?: OrderItem[]

  // ❌ 错误：autowired 对数组无效
  @Column({ model: OrderItem, autowired: true })
  items?: OrderItem[]  // 结果是 undefined，不是 []
}
```

## 对比 default

```ts
// autowired：自动创建空模型实例（仅对象）
@Column({ model: Address, autowired: true })
address?: Address
// 等效于
@Column({ model: Address, default: () => new Address() })
address?: Address

// default 更灵活：可以设置详细的默认值
@Column({ model: Address, default: () => new Address({ city: '北京' }) })
address?: Address

// 数组只能用 default
@Column({ model: OrderItem, default: () => [] })
items?: OrderItem[]
```

## 案例

::: tabs

@tab 对象模型（autowired 有效）

### 模型

```ts :no-line-numbers
<!-- @include: ./object.spec.ts#model -->
```

### 实例初始化

```ts :no-line-numbers
<!-- @include: ./object.spec.ts#instance -->
```

### 打印日志

```ts :no-line-numbers
<!-- @include: ./object.spec.ts#log -->
```

@tab 数组模型（使用 default）

::: info 说明
数组类型**不能使用 autowired**，必须使用 `default: () => []`。
:::

### 模型

```ts :no-line-numbers
<!-- @include: ./array.spec.ts#model -->
```

### 实例初始化

```ts :no-line-numbers
<!-- @include: ./array.spec.ts#instance -->
```

### 打印日志

```ts :no-line-numbers
<!-- @include: ./array.spec.ts#log -->
```

@tab 普通类型（autowired 无效）

::: danger 注意
`autowired` 对普通类型完全无效，以下示例中所有值都是 `undefined`。
:::

### 模型

```ts :no-line-numbers
<!-- @include: ./primitive.spec.ts#model -->
```

### 实例初始化

```ts :no-line-numbers
<!-- @include: ./primitive.spec.ts#instance -->
```

### 打印日志

```ts :no-line-numbers
<!-- @include: ./primitive.spec.ts#log -->
```

:::

## 注意事项

- `autowired` **仅对单个嵌套对象有效**，必须配合 `model` 使用
- **数组初始化**：使用 `default: () => []`，不要用 `autowired`
- **普通类型初始化**：使用 `default`，参考 [`default`](/column/default/)
- 如果需要设置更复杂的默认值，建议使用 `default` 函数
