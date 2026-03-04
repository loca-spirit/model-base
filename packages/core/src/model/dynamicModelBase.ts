/**
 * 动态模型创建器
 *
 * 提供在运行时动态创建模型类的能力，无需预先定义 TypeScript 类。
 * 适用于 API 响应结构不固定或需要根据配置动态生成模型的场景。
 */

import { __MODEL__ } from '../constant'
import { ColumnDefine } from '../decorator/Column'
import type { IColumnDefined, IDataModel, IModelOptions } from '../decorator/types'
import { ModelBase } from './ModelBase'

/**
 * 根据类型字符串生成实际类型
 *
 * 将列定义中的字符串类型转换为 JavaScript 构造函数或特殊标识。
 * 对于嵌套模型（array/object 类型），如果 model 是对象配置则递归创建动态模型。
 *
 * @param typeStr - 类型字符串
 * @param column - 列定义配置
 * @returns 对应的类型构造函数或标识
 */
export function genType(typeStr: string, column: IColumnDefined) {
  let designType
  switch (typeStr) {
    case 'array':
      // 如果 model 传入的是配置对象，递归创建动态模型
      if (column.model && typeof column.model !== 'function') {
        column.model = dynamicModelBase(column.model)
      }
      designType = 'array'
      break
    case 'object':
      // 如果 model 传入的是配置对象，递归创建动态模型
      if (column.model && typeof column.model !== 'function') {
        column.model = dynamicModelBase(column.model)
      }
      break
    case 'number':
      designType = Number
      break
    case 'string':
      designType = String
      break
    case 'boolean':
      designType = Boolean
      break
    default:
      // 其他类型保持原样
      break
  }
  return designType
}

type Model<T> = T extends ModelBase ? ModelBase : T

/**
 * 创建动态模型类
 *
 * 根据列配置对象动态生成一个继承自 ModelBase 的类。
 * 返回的类可以像普通模型类一样使用。
 *
 * @typeParam T - 模型类型（默认为 ModelBase）
 * @param columnObj - 列配置对象，键为属性名，值为列配置
 * @param params - 数据模型配置（如自定义方法）
 * @returns 动态生成的模型类
 *
 * @example
 * ```typescript
 * // 创建动态模型类
 * const UserModel = dynamicModelBase({
 *   id: { type: 'number', primary: true },
 *   name: { type: 'string' },
 *   profile: {
 *     type: 'object',
 *     model: {
 *       avatar: { type: 'string' },
 *       bio: { type: 'string' }
 *     }
 *   },
 *   tags: {
 *     type: 'array',
 *     model: {
 *       name: { type: 'string' }
 *     }
 *   }
 * })
 *
 * // 使用动态模型类
 * const user = UserModel.create({
 *   id: 1,
 *   name: 'John',
 *   profile: { avatar: 'url', bio: 'Hello' },
 *   tags: [{ name: 'developer' }]
 * })
 * ```
 */
export function dynamicModelBase<T = ModelBase>(
  columnObj: {
    [key: string]: IColumnDefined
  },
  params?: IDataModel,
) {
  class CustomDefinedModel extends ModelBase {
    constructor(dto?: any, options?: IModelOptions) {
      super(dto, options)
    }
  }

  // 为每个属性应用 ColumnDefine 装饰器
  Object.keys(columnObj).forEach((key) => {
    const column = columnObj[key]
    const typeStr = column.type || 'string'
    column.name = column.name || key
    column.type = genType(typeStr, column)
    ColumnDefine(column)(CustomDefinedModel.prototype, key)
  })

  // 应用自定义方法配置
  if (params?.methods) {
    const model = {
      methods: params?.methods || {},
    } as IDataModel
    ;(CustomDefinedModel.prototype.constructor as any)[__MODEL__] = model
  }

  return CustomDefinedModel as any as new (dto?: any, options?: IModelOptions) => Model<T>
}
