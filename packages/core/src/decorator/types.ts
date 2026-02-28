type Primitive = string | number | boolean | bigint | symbol | null | undefined

export type ExcludeFunction<T> = Pick<T, { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]>

export type SnakeCase<T> = T extends `${infer F}${infer R}`
  ? F extends Capitalize<F>
    ? `_${Uncapitalize<F>}${SnakeCase<R>}`
    : `${F}${SnakeCase<R>}`
  : T

export type ModelType<T> = {
  [K in keyof ExcludeFunction<T>]?: T[K] extends Primitive ? T[K] : ModelType<T[K]>
}
export type ModelSnakeType<T> = {
  [K in keyof ExcludeFunction<T> as SnakeCase<K>]?: T[K] extends Primitive ? T[K] : ModelSnakeType<T[K]>
}

export enum CLEAN_ENUM {
  // undefined
  CLEAN_UNDEFINED = 'cleanUndefined',
  // undefined or null
  CLEAN_UNDEFINED_AND_NULL = 'cleanUndefinedAndNull',
  // undefined or null or '' or [] or {}
  CLEAN_DIRTY = 'cleanDirty',
}

export type TSerializableParam = {
  clean?: CLEAN_ENUM
  enableEmptyValue?: boolean
  group?: string
  excludeGroup?: string
  trim?: boolean
  camelCase?: boolean
}

export type ElementOf<T> = T extends Array<infer E> ? E : never

export type IColumnDefault<T> = {
  name: string
  property: string
  data: any
  column: IColumnInner<T>
}
export type IColumnSerialize<T = any> = {
  value?: any
  name: string
  property: string
  deserializeData: T
  column: IColumnInner<T>
}
export type IColumnDeserialize<T = any> = {
  value?: any
  name: string
  property: string
  serializeData: any
  column: IColumnInner<T>
}

export interface IColumn<T = any> {
  name?: string // camelCase
  aliasName?: string // camelCase
  emptyValue?: any // 序列化如果值为空，则设置为这个值。
  type?: any
  childType?: any
  group?: string | string[]
  model?: any
  formatter?: any
  serialize?: (data: IColumnSerialize<T>) => any
  trim?: boolean
  primary?: boolean
  foreign?: boolean
  strictNameCheck?: boolean
  strictAliasNameCheck?: boolean
  default?: any | ((data: IColumnDefault<T>) => any) // 反序列化如果值为这个值，则设置为默认值。
  autowired?: boolean
  unformatter?: any
  deserialize?: (data: IColumnDeserialize<T>) => any
  extData?: any
}

export interface IColumnDefined<T = any> extends IColumn<T> {
  type?: any
}

export interface IColumnInner<T = any> extends IColumn<T> {
  property: string // 属性名
  name: string // snake_case
  camelCaseName: string // camelCase
  camelCaseAliasName?: string // camelCase
  type: any
}

export interface IModelProps {
  noDefault?: boolean // 初始化不设置默认值
  enableDataState?: boolean // 是否启用数据状态
  keepModelName?: boolean // 是否采用dto数据中的模型的key
  columnsInValue?: boolean // 是否根据模型实例中的值来初始化模型的列
  deserializeNamingStrategies?: 'mix' | 'camelCase' | 'snakeCase'
  serializeNamingStrategies?: 'camelCase' | 'snakeCase'
}

export interface IModelOptions extends IModelProps {
  // new 实例的时候，仅针对当前模型生效 begin
  current?: IModelProps
  // new 实例的时候，仅针对当前模型生效 end
  group?: string // 分组 新增、更新、删除的时候，是否指定分组
  excludeGroup?: string // 排除分组，新增、更新、删除的时候，是否指定排除分组
  __isInit?: boolean
  __noDeserialize?: boolean
}
export interface IDataModel extends IModelProps {
  methods?: { [key: string]: any }
}
export interface IModelUpdateOptions {
  group?: string
  excludeGroup?: string
  current?: IModelProps
}
