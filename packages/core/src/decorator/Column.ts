/**
 * @Column 属性装饰器
 *
 * 用于标记模型属性并配置其序列化/反序列化行为。
 * 支持 TypeScript 5.0 新版装饰器语法和旧版实验性装饰器语法。
 */

import { cloneDeep } from 'lodash'
import { camelToSnake, snakeToCamel } from '../_utils/columnName'
import { getModelProps } from '../_utils/ModelBaseProps'
import { __COLUMNS__ } from '../constant'
import { IColumn, IColumnInner } from './types'

/**
 * 根据值推断类型
 *
 * 用于 columnsInValue 模式下，从实际值推断属性类型。
 *
 * @param value - 属性值
 * @returns 推断出的类型
 */
export function genTypeByValue(value: any) {
  let type = Object as any
  const typeOfValue = typeof value
  if (typeOfValue === 'number') {
    type = Number
  }
  if (typeOfValue === 'string') {
    type = String
  }
  if (typeOfValue === 'boolean') {
    type = Boolean
  }
  if (Array.isArray(value)) {
    type = 'array'
  }
  return type
}

/**
 * 从数据对象生成列定义
 *
 * 用于 columnsInValue 模式下，自动从对象数据推断列配置。
 * 适用于动态数据结构或无需显式定义列的场景。
 *
 * @param model - 模型实例
 * @param data - 数据对象
 * @returns 列配置映射
 */
export function generateColumnsFromData<T>(model: any, data: any) {
  const isColInVal = getModelProps(model, 'columnsInValue')
  const keepMn = getModelProps(model, 'keepModelName')

  const keys = Object.keys(data)
  const columns_ = {} as { [key: string]: IColumnInner<T> }

  if (keys.length) {
    if (isColInVal) {
      keys.forEach((key) => {
        columns_[key] = {
          property: key,
          type: genTypeByValue((data as any)[key]),
          name: keepMn ? key : camelToSnake(key),
          camelCaseName: keepMn ? key : snakeToCamel(key),
        }
      })
    }
  }
  return columns_
}

function initColumn<T>(target: any, property_: string | symbol, columns_: any, params?: IColumnInner<T>) {
  let params_ = cloneDeep(params || {}) as IColumnInner<T>
  let property = property_
  if (typeof property_ === 'symbol') {
    // symbol是可以作为属性key的
    property = property_.toString()
  }

  const columns = columns_
  if (!params) {
    params_ = {
      property: undefined as any,
      name: undefined as any,
      camelCaseName: undefined as any,
      type: undefined,
    }
  }
  params_.property = property as string
  // 兼容childType，新的名字为model
  params_.childType = params_.childType || params_.model

  if (params?.name) {
    if (params.strictNameCheck) {
      params_.name = params.name
      params_.camelCaseName = params.name
    } else {
      params_.name = camelToSnake(params.name)
      params_.camelCaseName = snakeToCamel(params.name)
    }
  } else {
    params_.name = camelToSnake(property as string)
    params_.camelCaseName = snakeToCamel(property as string)
  }

  if (params?.aliasName) {
    if (params?.strictAliasNameCheck) {
      params_.aliasName = params.aliasName as string
      params_.camelCaseAliasName = params.aliasName as string
    } else {
      params_.camelCaseAliasName = snakeToCamel(params.aliasName)
      params_.aliasName = camelToSnake(params.aliasName)
    }
  }

  // const designType = Reflect.getMetadata('design:type', target, property)
  if (params?.type === 'array') {
    params_.type = Array
  }
  let g: any
  if (Array.isArray(params?.group)) {
    g = params?.group
  } else if (typeof params?.group === 'string') {
    g = [params?.group]
  } else {
    g = undefined
  }
  columns[property] = {
    name: params_.name,
    aliasName: params_.aliasName,
    camelCaseName: params_.camelCaseName,
    camelCaseAliasName: params_.camelCaseAliasName,
    type: params_.type,
    group: g,
    trim: params_.trim,
    primary: params_.primary,
    foreign: params_.foreign,
    emptyValue: params_.emptyValue,
    default: params_.default,
    autowired: params_.autowired,
    formatter: params_.formatter,
    unformatter: params_.unformatter,
    deserialize: params_.deserialize,
    serialize: params_.serialize,
    childType: params_.childType,
    extData: params_.extData,
  }
  return columns
}

interface ClassFieldDecoratorContext<This = unknown, Value = unknown> {
  /** The kind of class element that was decorated. */
  readonly kind: 'field'

  /** The name of the decorated class element. */
  readonly name: string | symbol

  /** A value indicating whether the class element is a static (`true`) or instance (`false`) element. */
  readonly static: boolean

  /** A value indicating whether the class element has a private name. */
  readonly private: boolean

  /** An object that can be used to access the current value of the class element at runtime. */
  readonly access: {
    /**
     * Determines whether an object has a property with the same name as the decorated element.
     */
    has(object: This): boolean

    /**
     * Gets the value of the field on the provided object.
     */
    get(object: This): Value

    /**
     * Sets the value of the field on the provided object.
     */
    set(object: This, value: Value): void
  }

  /**
   * Adds a callback to be invoked immediately after the field being decorated
   * is initialized (regardless if the field is `static` or not).
   */
  addInitializer(initializer: (this: This) => void): void

  readonly metadata: DecoratorMetadata
}

declare type PropertyDecorator = (target: any, propertyKey: string | symbol | ClassFieldDecoratorContext) => void
declare type PropertyDecoratorOld = (target: any, propertyKey: string | symbol) => void

/**
 * @Column 属性装饰器
 *
 * 标记模型属性并配置其序列化/反序列化行为。
 * 支持 TypeScript 5.0+ 新版装饰器和旧版实验性装饰器。
 *
 * TypeScript 类型映射：
 * - number → Number
 * - string → String
 * - boolean → Boolean
 * - any → Object
 * - void → undefined
 * - Array → Array
 * - Tuple → Array
 * - class → 类构造函数
 * - Enum → Number
 * - 有调用签名 → Function
 * - 其他（含 interface）→ Object
 *
 * @param col - 列配置选项
 * @returns 属性装饰器
 *
 * @example
 * ```typescript
 * class User extends ModelBase {
 *   @Column({ primary: true })
 *   id: number
 *
 *   @Column({ name: 'user_name' })
 *   userName: string
 *
 *   @Column({ model: Address })
 *   address: Address
 *
 *   @Column({
 *     deserialize: ({ value }) => new Date(value),
 *     serialize: ({ value }) => value?.toISOString()
 *   })
 *   createdAt: Date
 * }
 * ```
 */
export function Column(col?: IColumn): PropertyDecorator {
  const params = col as IColumnInner
  return (target: any, context: string | symbol | ClassFieldDecoratorContext<typeof target, any>) => {
    if (target?.constructor) {
      // 旧版装饰器语法（experimentalDecorators）
      const property = context as string | symbol
      const metadata = (target.constructor as any)[Symbol.metadata] || {}
      const columns = metadata[__COLUMNS__] || {}
      // 继承关系时需要深拷贝，避免污染父类的 columns
      metadata[__COLUMNS__] = initColumn(target, property, cloneDeep(columns), params)
      ;(target.constructor as any)[Symbol.metadata] = metadata
    } else {
      // 新版装饰器语法（TypeScript 5.0+）
      const property = (context as ClassFieldDecoratorContext<typeof target, any>).name
      const metadata = (context as any).metadata || {}
      const columns = metadata[__COLUMNS__] || {}
      metadata[__COLUMNS__] = initColumn(metadata, property, cloneDeep(columns), params)
      ;(context as any).metadata = metadata
      return function (this: any, value: any) {
        return this[property]
      }
    }
  }
}

/**
 * 列定义装饰器（仅支持旧版语法）
 *
 * 用于 dynamicModelBase 动态创建模型时的列定义。
 * 与 @Column 功能相同，但仅支持旧版装饰器语法。
 *
 * @param col - 列配置选项
 * @returns 属性装饰器
 */
export function ColumnDefine<T>(col?: IColumn<T>): PropertyDecoratorOld {
  return (target: any, property: string | symbol) => {
    const params = col as IColumnInner<T>
    const metadata = (target.constructor as any)[Symbol.metadata] || {}
    const columns = metadata[__COLUMNS__] || {}
    const columns_ = initColumn<T>(target, property, columns, params)
    metadata[__COLUMNS__] = columns_
    ;(target.constructor as any)[Symbol.metadata] = metadata
  }
}
