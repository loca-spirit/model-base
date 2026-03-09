/**
 * 序列化/反序列化工具方法
 *
 * 提供模型与 DTO 之间转换的便捷函数，支持单个模型、数组、Record 等多种数据结构。
 */

import { create } from '../_utils/create'
import { CLEAN_ENUM, type IModelOptions, type TSerializableParam } from '../decorator'
import { ModelBase } from '../model'
import { modelToSerializableObj } from './modelToSerializableObj'

/**
 * 反序列化：将 DTO 转换为模型实例
 *
 * @typeParam T - 模型类型
 * @param type - 模型类
 * @param data - DTO 数据或模型实例
 * @param options - 模型选项
 * @returns 模型实例
 *
 * @example
 * const user = deserialize(User, { user_name: 'John' })
 */
export function deserialize<T extends ModelBase>(
  type: new (dto: any, options?: IModelOptions) => T,
  data: any,
  options?: IModelOptions,
) {
  return create(type)(data?.constructor?.isModelBase ? data.getSerializableObject() : data, options)
}

/**
 * 反序列化数组：将 DTO 数组转换为模型实例数组
 *
 * @typeParam T - 模型类型
 * @param itemType - 数组元素的模型类
 * @param dtos - DTO 数组
 * @param options - 模型选项
 * @returns 模型实例数组
 *
 * @example
 * const users = deserializeArray(User, [{ user_name: 'John' }, { user_name: 'Jane' }])
 */
export function deserializeArray<T extends ModelBase>(
  itemType: new (dto: any, options?: IModelOptions) => T,
  dtos: any[],
  options?: IModelOptions,
) {
  if (!dtos) return
  const list: T[] = []
  dtos.forEach((dto) => list.push(deserialize(itemType, dto, options)))
  return list
}

/**
 * 反序列化 Record：将 DTO 对象映射转换为模型实例映射
 *
 * @typeParam T - 模型类型
 * @param itemType - 模型类
 * @param dtos - DTO 对象映射
 * @param options - 模型选项
 * @returns 模型实例映射
 *
 * @example
 * const userMap = deserializeRecord(User, {
 *   admin: { user_name: 'Admin' },
 *   guest: { user_name: 'Guest' }
 * })
 */
export function deserializeRecord<T extends ModelBase>(
  itemType: new (dto: any, options?: IModelOptions) => T,
  dtos: { [key: string]: any },
  options?: IModelOptions,
) {
  if (!dtos) return
  return Object.keys(dtos || {}).reduce((acc, property) => {
    acc[property] = deserialize(itemType, dtos[property], options)
    return acc
  }, {} as { [key: string]: T })
}

/**
 * 反序列化 Record 数组：将 DTO 数组映射转换为模型实例数组映射
 *
 * @typeParam T - 模型类型
 * @param itemType - 模型类
 * @param dtos - DTO 数组映射
 * @param options - 模型选项
 * @returns 模型实例数组映射
 *
 * @example
 * const groupedUsers = deserializeRecordArray(User, {
 *   admins: [{ user_name: 'Admin1' }],
 *   guests: [{ user_name: 'Guest1' }, { user_name: 'Guest2' }]
 * })
 */
export function deserializeRecordArray<T extends ModelBase>(
  itemType: new (dto: any, options?: IModelOptions) => T,
  dtos: { [key: string]: any },
  options?: IModelOptions,
) {
  if (!dtos) return
  return Object.keys(dtos || {}).reduce((acc, property) => {
    acc[property] = deserializeArray(itemType, dtos[property], options) || []
    return acc
  }, {} as { [key: string]: T[] })
}

/**
 * 序列化：将模型实例转换为 DTO
 *
 * 支持多种数据结构：
 * - 单个模型实例
 * - 模型实例数组
 * - 模型实例 Record
 * - 模型实例数组 Record
 *
 * @param data - 模型实例或集合
 * @param options - 序列化选项
 * @returns 序列化后的 DTO
 *
 * @example
 * const dto = serialize(user) // 单个模型
 * const dtos = serialize([user1, user2]) // 数组
 * const dtoMap = serialize({ admin: adminUser }) // Record
 */
export function serialize(
  data: ModelBase | ModelBase[] | { [key: string]: ModelBase } | { [key: string]: ModelBase[] } | undefined,
  options?: TSerializableParam,
) {
  const options_ = options || { clean: CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL }

  if (Array.isArray(data)) {
    return data.map((item) => modelToSerializableObj(item, options_))
  }

  if ((data as any)?.constructor?.isModelBase) {
    return modelToSerializableObj(data as ModelBase, options_)
  }

  const data_ = data || {}
  return Object.keys(data_).reduce((acc, property) => {
    acc[property] = Array.isArray(data_[property])
      ? data_[property].map((item) => modelToSerializableObj(item, options_))
      : modelToSerializableObj(data_[property], options_)
    return acc
  }, {} as { [key: string]: any })
}
