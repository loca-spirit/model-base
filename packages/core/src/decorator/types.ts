/**
 * Model Base 类型定义
 *
 * 定义模型系统中使用的所有 TypeScript 类型和接口。
 */

/** 基本类型联合 */
type Primitive = string | number | boolean | bigint | symbol | null | undefined

/**
 * 从类型 T 中排除函数类型的属性
 *
 * @typeParam T - 原始类型
 */
export type ExcludeFunction<T> = Pick<T, { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]>

/**
 * 将驼峰命名转换为蛇形命名的类型工具
 *
 * @typeParam T - 驼峰命名的字符串类型
 *
 * @example
 * type Result = SnakeCase<'userName'> // 'user_name'
 */
export type SnakeCase<T> = T extends `${infer F}${infer R}`
  ? F extends Capitalize<F>
    ? `_${Uncapitalize<F>}${SnakeCase<R>}`
    : `${F}${SnakeCase<R>}`
  : T

/**
 * 模型类型（驼峰命名，所有属性可选）
 *
 * 用于表示模型的部分数据，常用于创建和更新操作。
 *
 * @typeParam T - 模型类型
 */
export type ModelType<T> = {
  [K in keyof ExcludeFunction<T>]?: T[K] extends Primitive ? T[K] : ModelType<T[K]>
}

/**
 * 模型类型（蛇形命名，所有属性可选）
 *
 * 用于表示后端 API 返回的数据格式。
 *
 * @typeParam T - 模型类型
 */
export type ModelSnakeType<T> = {
  [K in keyof ExcludeFunction<T> as SnakeCase<K>]?: T[K] extends Primitive ? T[K] : ModelSnakeType<T[K]>
}

/**
 * 空值清理策略枚举
 *
 * 用于序列化时控制如何处理空值属性。
 */
export enum CLEAN_ENUM {
  /** 仅清理 undefined 值 */
  CLEAN_UNDEFINED = 'cleanUndefined',
  /** 清理 undefined 和 null 值 */
  CLEAN_UNDEFINED_AND_NULL = 'cleanUndefinedAndNull',
  /** 清理所有空值：undefined、null、空字符串、空数组、空对象 */
  CLEAN_DIRTY = 'cleanDirty',
}

/**
 * 序列化参数配置
 */
export type TSerializableParam = {
  /** 空值清理策略 */
  clean?: CLEAN_ENUM
  /** 是否启用 emptyValue 配置 */
  enableEmptyValue?: boolean
  /** 仅序列化指定分组 */
  group?: string
  /** 排除指定分组 */
  excludeGroup?: string
  /** 是否去除字符串首尾空格 */
  trim?: boolean
  /** 是否使用驼峰命名 */
  camelCase?: boolean
}

/**
 * 获取数组元素类型
 *
 * @typeParam T - 数组类型
 */
export type ElementOf<T> = T extends Array<infer E> ? E : never

/**
 * 列默认值回调函数的参数类型
 */
export type IColumnDefault<T> = {
  /** 列名（序列化名称） */
  name: string
  /** 属性名 */
  property: string
  /** 原始 DTO 数据 */
  data: any
  /** 列配置 */
  column: IColumnInner<T>
}

/**
 * 序列化回调函数的参数类型
 */
export type IColumnSerialize<T = any> = {
  /** 当前属性值 */
  value?: any
  /** 列名（序列化名称） */
  name: string
  /** 属性名 */
  property: string
  /** 完整的模型实例 */
  deserializeData: T
  /** 列配置 */
  column: IColumnInner<T>
}

/**
 * 反序列化回调函数的参数类型
 */
export type IColumnDeserialize<T = any> = {
  /** DTO 中的原始值 */
  value?: any
  /** 列名（序列化名称） */
  name: string
  /** 属性名 */
  property: string
  /** 原始 DTO 数据 */
  serializeData: any
  /** 列配置 */
  column: IColumnInner<T>
}

/**
 * @Column 装饰器配置选项
 *
 * 用于定义模型属性的元数据配置。
 */
export interface IColumn<T = any> {
  /** 列名（驼峰命名，会自动转换为蛇形） */
  name?: string
  /** 列别名（用于兼容不同的 API 响应格式） */
  aliasName?: string
  /** 序列化时如果值为空，使用此值替代 */
  emptyValue?: any
  /** 属性类型 */
  type?: any
  /** 嵌套子模型类型 */
  childType?: any
  /** 分组标识，用于选择性序列化 */
  group?: string | string[]
  /** 嵌套模型类（childType 的别名） */
  model?: any
  /** @deprecated 使用 deserialize 替代。反序列化转换函数 */
  formatter?: any
  /** 序列化转换函数 */
  serialize?: (data: IColumnSerialize<T>) => any
  /** 是否去除字符串首尾空格 */
  trim?: boolean
  /** 是否为主键 */
  primary?: boolean
  /** 是否为外键 */
  foreign?: boolean
  /** 严格检查名称（不进行命名转换） */
  strictNameCheck?: boolean
  /** 严格检查别名（不进行命名转换） */
  strictAliasNameCheck?: boolean
  /** 默认值，可以是固定值或返回默认值的函数 */
  default?: any | ((data: IColumnDefault<T>) => any)
  /** 是否自动注入（与 default=true 类似） */
  autowired?: boolean
  /** @deprecated 使用 serialize 替代。序列化转换函数 */
  unformatter?: any
  /** 反序列化转换函数 */
  deserialize?: (data: IColumnDeserialize<T>) => any
  /** 扩展数据，用于存储自定义元数据 */
  extData?: any
}

/**
 * 动态模型的列定义
 *
 * 用于 dynamicModelBase 创建动态模型时的列配置。
 */
export interface IColumnDefined<T = any> extends IColumn<T> {
  /** 类型，支持字符串形式：'string' | 'number' | 'boolean' | 'array' | 'object' */
  type?: any
}

/**
 * 列的内部表示
 *
 * 包含经过处理的完整列元数据。
 */
export interface IColumnInner<T = any> extends IColumn<T> {
  /** 属性名（类中定义的名称） */
  property: string
  /** 蛇形命名的列名 */
  name: string
  /** 驼峰命名的列名 */
  camelCaseName: string
  /** 驼峰命名的别名 */
  camelCaseAliasName?: string
  /** 属性类型 */
  type: any
}

/**
 * 模型属性配置
 *
 * 控制模型的行为特性。
 */
export interface IModelProps {
  /** 初始化时是否跳过默认值设置 */
  noDefault?: boolean
  /** 是否启用数据状态追踪（变更检测） */
  enableDataState?: boolean
  /** 是否保持原始属性名（不进行命名转换） */
  keepModelName?: boolean
  /** 是否从实例值推断列定义 */
  columnsInValue?: boolean
  /** 反序列化命名策略 */
  deserializeNamingStrategies?: 'mix' | 'camelCase' | 'snakeCase'
  /** 序列化命名策略 */
  serializeNamingStrategies?: 'camelCase' | 'snakeCase'
}

/**
 * 模型实例化选项
 *
 * 创建或更新模型实例时的配置参数。
 */
export interface IModelOptions extends IModelProps {
  /** 仅对当前模型实例生效的配置（不影响嵌套模型） */
  current?: IModelProps
  /** 分组标识，用于选择性序列化/反序列化 */
  group?: string
  /** 排除的分组标识 */
  excludeGroup?: string
  /** 内部标识：是否已完成初始化 */
  __isInit?: boolean
  /** 内部标识：是否跳过反序列化处理 */
  __noDeserialize?: boolean
}

/**
 * @DataModel 装饰器配置
 *
 * 类级别的模型配置。
 */
export interface IDataModel extends IModelProps {
  /** 自定义方法映射 */
  methods?: { [key: string]: any }
}

/**
 * 模型更新选项
 */
export interface IModelUpdateOptions {
  /** 分组标识 */
  group?: string
  /** 排除的分组标识 */
  excludeGroup?: string
  /** 仅对当前模型实例生效的配置 */
  current?: IModelProps
}
