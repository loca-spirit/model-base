import { cloneDeep } from 'lodash'
import { camelToSnake, snakeToCamel } from '../_utils/columnName'
import { getModelProps } from '../_utils/ModelBaseProps'
import { __COLUMNS__ } from '../constant'
import { IColumn, IColumnInner } from './types'

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
          // 正常column是从name上获取值，但是因为是通过value进行推断，所以没法传入name，只能全局设置，否则默认就是下划线的column。
          name: keepMn ? key : camelToSnake(key), // serialized name
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
 * @description 设置 primary 的主键的值只能是 string | number, 主键的值理论上不允许为空
 *
 * @description
 *
 * number serialized as Number
 * string serialized as String
 * boolean serialized as Boolean
 * any serialized as Object
 * void serializes as undefined
 * Array serialized as Array
 * If a Tuple, serialized as Array
 * If a class serialized it as the class constructor
 * If an Enum serialized it as Number
 * If has at least one call signature, serialized as Function
 * Otherwise serialized as Object (Including interfaces)
 *
 * @constructor
 * @param col
 */

export function Column(col?: IColumn): PropertyDecorator {
  const params = col as IColumnInner
  return (target: any, context: string | symbol | ClassFieldDecoratorContext<typeof target, any>) => {
    if (target?.constructor) {
      const property = context as string | symbol
      // 继承关系的时候，需要cloneDeep，否则会污染父类的columns
      const metadata = (target.constructor as any)[Symbol.metadata] || {}
      const columns = metadata[__COLUMNS__] || {}
      metadata[__COLUMNS__] = initColumn(target, property, cloneDeep(columns), params)
      ;(target.constructor as any)[Symbol.metadata] = metadata
    } else {
      const property = (context as ClassFieldDecoratorContext<typeof target, any>).name
      const metadata = (context as any).metadata || {}
      const columns = metadata[__COLUMNS__] || {}
      metadata[__COLUMNS__] = initColumn(metadata, property, cloneDeep(columns), params)
      ;(context as any).metadata = metadata
      // 新版本装饰器和旧版本统一，都不支持属性直接设置默认值。
      // return function (this: any, value: any) {
      //   if (typeof value === 'undefined' || typeof this[property] !== 'undefined') {
      //     return this[property]
      //   }
      //   // 支持 User.create模式，将 默认值 value 放到 default 中统一处理。
      //   if (!columns[property].default) {
      //     columns[property].default = () => value
      //   }
      //   return value
      // }
      return function (this: any, value: any) {
        return this[property]
      }
    }
  }
}

export function ColumnDefine<T>(col?: IColumn<T>): PropertyDecoratorOld {
  return (target: any, property: string | symbol) => {
    const params = col as IColumnInner<T>
    const metadata = (target.constructor as any)[Symbol.metadata] || {}
    const columns = metadata[__COLUMNS__] || {}
    // 初始化列
    const columns_ = initColumn<T>(target, property, columns, params)
    metadata[__COLUMNS__] = columns_
    ;(target.constructor as any)[Symbol.metadata] = metadata
  }
}
