/**
 * 模型实例创建工具
 *
 * 提供统一的模型实例化接口，支持直接类引用和惰性加载函数两种方式。
 */

import type { IModelOptions } from '../decorator/types'
import type { ModelBase } from '../model/ModelBase'

/**
 * 解析模型类型，支持直接类引用或返回类的函数
 *
 * 此函数处理两种情况：
 * 1. 直接传入 ModelBase 子类
 * 2. 传入返回 ModelBase 子类的函数（用于解决循环依赖）
 *
 * @param fn_ - ModelBase 子类或返回该类的函数
 * @returns 解析后的 ModelBase 子类
 */
export function getModelType(fn_: any) {
  let fn: any = fn_

  // 如果不是 ModelBase 子类，尝试作为函数调用获取实际类型
  if (fn_ && !(fn_ as any).isModelBase) {
    try {
      fn = (fn_ as any).call(null)
    } catch (e) {
      fn = fn_
      console.error(e)
    }
  }
  return fn as typeof ModelBase
}

/**
 * 创建模型实例的高阶函数
 *
 * 返回一个工厂函数，用于根据 DTO 数据创建模型实例。
 * 支持惰性类型解析，解决循环依赖问题。
 *
 * @typeParam T - 模型类型
 * @param fn_ - 模型类或返回模型类的函数
 * @returns 接收 DTO 和选项，返回模型实例的工厂函数
 *
 * @example
 * const createUser = create(User)
 * const user = createUser({ name: 'John' })
 *
 * // 或使用惰性加载解决循环依赖
 * const createPost = create(() => Post)
 */
export function create<T extends ModelBase>(fn_: new (dto?: any, options?: IModelOptions) => T) {
  return function createDTO(dto?: any, options?: IModelOptions) {
    const fn = getModelType(fn_)
    const t_ = fn.create(dto, options)
    return t_ as T
  }
}
