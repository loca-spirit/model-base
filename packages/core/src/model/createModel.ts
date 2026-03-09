/**
 * 模型创建工厂函数
 *
 * 提供便捷的模型实例创建方法，支持静态类型和动态模型。
 */

import type { IColumnDefined, IDataModel, IModelOptions, ModelSnakeType, ModelType } from '../decorator/types'
import { dynamicModelBase } from './dynamicModelBase'
import { ModelBase } from './ModelBase'

/**
 * 创建模型实例
 *
 * 支持直接传入模型类或返回模型类的函数（用于解决循环依赖）。
 *
 * @typeParam T - 模型类型
 * @param model - 模型类或返回模型类的函数
 * @param dto - 初始化数据（支持驼峰或蛇形命名）
 * @param options - 模型选项
 * @returns 模型实例
 *
 * @example
 * ```typescript
 * // 直接使用类
 * const user = createModel(User, { user_name: 'John' })
 *
 * // 使用函数（解决循环依赖）
 * const post = createModel(() => Post, { title: 'Hello' })
 * ```
 */
export function createModel<T>(
  model: new (...args: any[]) => T | (() => new (...args: any[]) => T),
  dto: ModelSnakeType<T> & ModelType<T>,
  options?: IModelOptions,
) {
  const options_ = options || {}
  let t_: any
  if ((model as any as typeof ModelBase).isModelBase) {
    t_ = (model as any as typeof ModelBase).create(dto, options_)
  } else {
    t_ = ((model as any)() as typeof ModelBase).create(dto, options_)
  }
  return t_ as T
}

/**
 * 创建动态模型实例
 *
 * 无需预先定义类，直接通过列配置对象创建模型实例。
 * 适用于 API 响应结构不固定或需要运行时动态定义模型的场景。
 *
 * @param columnObj - 列配置对象
 * @param dto - 初始化数据
 * @param modelParams - 模型选项
 * @param params - 数据模型配置
 * @returns 动态模型实例
 *
 * @example
 * ```typescript
 * const user = createDynamicModel(
 *   {
 *     name: { type: 'string' },
 *     age: { type: 'number' }
 *   },
 *   { name: 'John', age: 30 }
 * )
 * ```
 */
export function createDynamicModel(
  columnObj: { [key: string]: IColumnDefined },
  dto: any,
  modelParams?: IModelOptions,
  params?: IDataModel,
) {
  return (dynamicModelBase(columnObj as any, params) as typeof ModelBase).create(dto, modelParams)
}
