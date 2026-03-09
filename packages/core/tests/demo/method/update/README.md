---
permalink: /method/update/
---

# update 增量更新

## 说明

对模型实例进行增量更新，只更新 DTO 中存在的属性，保留其他属性不变。

普通字段更新不依赖主键；只有在更新嵌套模型，尤其是模型数组时，才需要为子模型设置 `primary`。`update()` 会用主键匹配已有项，命中则增量更新，未命中则追加新项。

## 方法签名

```ts
update(dto: object): this
```

## 参数说明

| 参数 | 类型 | 说明 |
|-----|------|------|
| `dto` | `object` | 更新的数据，支持 snake_case 和 camelCase |

## 与直接赋值的区别

```ts
// 直接赋值：需要手动处理每个字段
user.userName = dto.user_name
user.email = dto.email

// update：自动处理命名转换和嵌套模型
user.update(dto)
```

## update vs 重新创建实例

| 操作 | 对象引用 | 变更追踪 | 性能 |
|-----|---------|---------|-----|
| `update(dto)` | 保持不变 | 基于原快照 | 更优 |
| `new Model(dto)` | 新对象 | 重置 | 需重建 |

## 使用场景

- **WebSocket 推送**：接收服务端推送的局部更新
- **轮询刷新**：定时刷新部分数据
- **表单回填**：从 API 获取最新数据更新表单

## 使用示例

```ts
const user = new User({
  id: 1,
  user_name: 'John',
  email: 'john@test.com'
})

// 服务端推送了部分更新
const updateData = { user_name: 'Jane' }

// 增量更新（email 保持不变）
user.update(updateData)

console.log(user.userName) // 'Jane'
console.log(user.email)    // 'john@test.com' (未变)
```

## 嵌套模型更新

```ts
class OrderItem extends ModelBase {
  @Column({ primary: true })
  id?: number

  @Column()
  name?: string
}

class Order extends ModelBase {
  @Column({ model: OrderItem })
  items?: OrderItem[]
}

const order = new Order({ items: [{ id: 1, name: 'A' }] })

// 更新嵌套数组（基于主键匹配）
order.update({
  items: [
    { id: 1, name: 'A Updated' },  // 更新已有项
    { id: 2, name: 'B' }           // 新增项
  ]
})
```

## 注意事项

- 更新普通属性时，不需要设置主键
- 更新嵌套数组中的模型时，建议为子模型声明 `@Column({ primary: true })`
- 没有主键时，`update()` 无法可靠识别“更新已有项”还是“新增一项”

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

### 调用 update

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#update -->
```

### 打印日志

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#log -->
```

:::
