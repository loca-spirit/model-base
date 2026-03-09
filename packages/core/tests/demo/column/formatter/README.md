---
permalink: /column/formatter/
---

# formatter / deserialize 反序列化转换

## 说明

`formatter`（已废弃）或 `deserialize` 用于在反序列化时转换数据格式。当后端返回的数据需要进行格式转换时使用。

::: warning 注意
`formatter` 已废弃，请使用 `deserialize` 替代。
:::

## 配置

| 参数 | 类型 | 说明 |
|-----|------|------|
| `deserialize` | `(data: IColumnDeserialize) => any` | 反序列化转换函数 |
| `formatter` | `(data: IColumnDeserialize) => any` | 已废弃，使用 `deserialize` |

## 回调参数

```ts
interface IColumnDeserialize {
  value: any           // DTO 中的原始值
  name: string         // 列名（序列化名称）
  property: string     // 属性名
  serializeData: any   // 完整的 DTO 数据
  column: IColumnInner // 列配置
}
```

## 使用场景

- 日期字符串转 Date 对象
- 数值格式转换
- 枚举值映射
- 数据清洗和规范化

## 示例

```ts
class User extends ModelBase {
  // 日期转换
  @Column({
    deserialize: ({ value }) => value ? new Date(value) : undefined
  })
  createdAt?: Date

  // 枚举映射
  @Column({
    deserialize: ({ value }) => STATUS_MAP[value] || 'unknown'
  })
  status?: string

  // 数值处理
  @Column({
    deserialize: ({ value }) => Number(value) || 0
  })
  price?: number
}
```

## 案例

::: tabs

@tab 案例一

### 格式化函数

```ts :no-line-numbers
<!-- @include: ./init.spec.ts#fn -->
```

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

## 注意事项

- `deserialize` / `formatter` 在反序列化时触发（从后端获取数据）
- 如果需要在序列化时进行转换（提交给后端），请参考 [`serialize` / `unformatter`](/column/unformatter/)
- 推荐使用 `deserialize` 替代已废弃的 `formatter`
