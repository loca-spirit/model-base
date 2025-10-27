---
permalink: /guide/changelog/
---

## 更新日志

[//]: # 'template'
[//]: # '## 1.1.2'
[//]: # '#### Feature'
[//]: # '#### Fix'
[//]: # '#### Style'
[//]: # '#### Breaking Change'
[//]: # '#### Remove'

## 1.0.12

## @model-base/core
#### fix 增加副作用判断，支持按需加载。


## 1.0.1

## @model-base/core

### change

#### remove `emptyValueScope` 和 `emptyValue`

#### change `revertChangedDataObject` 还原 class 的时候创建新对象不会设置默认值。

#### 新装饰器的自动适配`experimentalDecorators`，大家用起来是无感的。

```ts
// 新版装饰器
{
    "experimentalDecorators": false,
}
// 旧版装饰器
{
    "experimentalDecorators": true,
}
```

#### 对`emitDecoratorMetadata`不再进行依赖

- 变更 1：`ModelBase`的`class`都需要传入`model`。
- 变更 2：`Column`装饰器的`autowired`不再支持数组，仅支持属性是`ModelBase`类型的自动初始化。

```ts
class UserList extends ModelBase {
  @Column({
    model: () => UserModel,
    default: () => [],
  })
  list!: UserModel[]

  @Column({
    model: () => UserModel,
    default: () => new UserModel(),
  })
  userA!: UserModel

  @Column({
    model: () => UserModel,
    autowired: true,
  })
  userB!: UserModel
}
```

#### change and feature `Column`装饰器增加`deserialize` 和 `serialize`

- 对应的是旧版本的 `formatter`和`unformatter`
- 参数全部调整，新的类型为 `IColumnSerialize`和`IColumnDeserialize`

```ts
export type IColumnSerialize = {
  value?: any
  name: string // 调整，对应旧版本的是key
  property: string // 新增，属性名
  deserializeData: T // 调整，对应之前的data，当前class的实例化数据。只读模式
  column: IColumnInner
}
export type IColumnDeserialize = {
  value?: any
  name: string // 调整，对应旧版本的是key
  property: string // 新增，属性名
  serializeData: any// 调整，对应之前的data，服务器的序列化数据。。只读模式
  column: IColumnInner
}
```

#### break change `getColumns` 
- `column` 变更为 `name` 

#### change and feature `name` 和 `aliseName` 支持传入 `camelCase` 风格的名字

- 增加 `strictNameCheck` 和 `strictAliasNameCheck`，设置为 true 后，序列化后强制使用`name` ，初始化强制使用 `aliseName`的名字，和旧的逻辑一致。
- `name` 和 `aliseName` 支持传入 `camelCase` 风格的名字了。支持序列化函数和反序列化函数(new)通过参数`camelCase`指定输入和输出。
- `name` 对应服务端的返回数据属性字段，如果服务端是下划线，则填入下划线数据，如果服务端是驼峰的，本次调整后，会根据默认的命名策略来适配，默认是`mix`模式，同时支持`camelCase` 和 `snakeCase`

- 变更前

```ts
class UserModel extends ModelBase {
  @Column({ name: 'testUserA' })
  testUserA!: number
  @Column({ name: 'test_user_b' })
  testUserA!: number
  @Column({ name: 'total_result' })
  total!: string
}
const user = new UserModel({ testUserA: 'usera', test_user_b: 'userb' })
user.getSerializableObject()
// { testUserA: 'usera', test_user_b: 'userb' }
user.getSerializableObject({ camelCase: true })
// { testUserA: 'usera', test_user_b: 'userb' }
```

- 变更后

```ts
class UserModel extends ModelBase {
  @Column({ name: 'testUserA' })
  testUserA!: number
  @Column({ name: 'testUserB' }) // 支持驼峰了
  testUserA!: number
  @Column({ name: 'totalResult' }) // 支持驼峰了
  total!: string
}
const user = new UserModel({ testUserA: 'usera', test_user_b: 'userb' })
user.getSerializableObject()
// { test_user_a: 'usera', test_user_b: 'userb' }
user.getSerializableObject({ camelCase: true })
// { testUserA: 'usera', testUserB: 'userb' }
```

```ts
class UserModel extends ModelBase {
  @Column({ name: 'testUserA', strictNameCheck: true }) // strictAliasNameCheck也是同样的道理。
  testUserA!: number
  @Column({ name: 'test_user_b', strictNameCheck: true })
  testUserA!: number
  @Column({ name: 'total_result', strictNameCheck: true })
  total!: string
}
const user = new UserModel({ testUserA: 'usera', test_user_b: 'userb' })
user.getSerializableObject()
// { testUserA: 'usera', test_user_b: 'userb' }
user.getSerializableObject({ camelCase: true })
// { testUserA: 'usera', test_user_b: 'userb' }
```

### Feature

##### 标准化 `IModelProps`，以下作用域范围由大到小。

- class: 通过`@DataModel`类装饰器传入，作用域在整个`class`上生效。

- instance: 支持`new`时候传入`IModelProps`，作用域在当前实例上生效。

- init: 在`new`的时候传入`IModelProps.current`属性，作用域在初始化阶段生效。

```ts
interface IModelProps {
  noDefault?: boolean // 初始化不设置默认值
  enableDataState?: boolean // 是否启用数据状态
  keepModelName?: boolean // 是否采用dto数据中的模型的key
  columnsInValue?: boolean // 是否根据模型实例中的值来初始化模型的列
  deserializeNamingStrategies?: 'mix' | 'camelCase' | 'snakeCase'
  serializeNamingStrategies?: 'camelCase' | 'snakeCase'
}
```

##### 标准化 `model`和 `default`的传入，推荐函数式传入。

    model的函数式传入可以避免循环依赖

    default的函数式传入可以避免

```ts
class UserList extends ModelBase {
  @Column({
    model: () => UserModel,
    default: () => [],
  })
  list!: UserModel[]
}
```

##### 内部标准化实例化统一用 `Class.create()`，避免 typescript 的`useDefineForClassFields`不同配置对实例化的效果造成影响。

##### 新旧装饰器都不允许通过`ClassField`进行`define`。请使用`default`

```ts
// 不支持
class UserModel extends ModelBase {
  @Column()
  id!: number = 1 // 不支持
  @Column()
  name!: string = 'user1' // 不支持
  @Column()
  list!: string = [] // 不支持
}
// 支持
class UserModel extends ModelBase {
  @Column({ default: 1 })
  id!: number
  @Column({ default: 'user1' })
  name!: string
  @Column({ default: () => [] }) // 引用类型请使用函数。
  list!: string
}
```

##### 支持`lodash`对`ModelBase`实例进行克隆
