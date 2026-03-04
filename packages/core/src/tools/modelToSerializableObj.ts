/**
 * 模型序列化工具
 *
 * 将模型实例转换为可序列化的普通对象（DTO）。
 */

import { cloneDeep, isPlainObject } from 'lodash'
import { getColumnSerializeName } from '../_utils/getColumnSerializeName'
import { getModelProps } from '../_utils/ModelBaseProps'
import { NAMING_STRATEGIES } from '../constant'
import { CLEAN_ENUM, IColumnSerialize, type IColumnInner, type TSerializableParam } from '../decorator/types'
import { type ModelBase } from '../model/ModelBase'

/**
 * 将模型实例转换为可序列化的对象
 *
 * 核心序列化函数，处理：
 * - 属性名转换（驼峰 ↔ 蛇形）
 * - 空值清理（根据 clean 策略）
 * - 嵌套模型递归序列化
 * - 自定义序列化函数（serialize/unformatter）
 * - 分组过滤
 * - 字符串 trim 处理
 *
 * @typeParam T - 模型类型
 * @param this_ - 模型实例
 * @param params - 序列化参数
 * @param params.clean - 空值清理策略
 * @param params.group - 仅包含指定分组
 * @param params.excludeGroup - 排除指定分组
 * @param params.camelCase - 是否使用驼峰命名
 * @param params.trim - 是否去除字符串首尾空格
 * @param params.enableEmptyValue - 是否使用 emptyValue 替代空值
 * @returns 序列化后的普通对象
 *
 * @example
 * const dto = modelToSerializableObj(user, {
 *   clean: CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL,
 *   camelCase: false
 * })
 */
export function modelToSerializableObj<T extends ModelBase>(
  this_: T,
  params: TSerializableParam,
): { [index: string]: any } {
  const sns =
    (typeof params.camelCase === 'boolean'
      ? params.camelCase
        ? NAMING_STRATEGIES.camelCase
        : NAMING_STRATEGIES.snakeCase
      : null) ?? getModelProps(this_, 'serializeNamingStrategies')
  const dto: { [index: string]: any } = {}
  const columns = ((this_ as ModelBase).getColumns?.() as { [key: string]: IColumnInner }) || {}
  const target = this_ as T
  for (const key in columns) {
    if (columns.hasOwnProperty(key)) {
      const value = target[key] as any
      const isUndefined = value === void 0
      const isNull = value === null
      const isEmptyString = typeof value === 'string' && value.replace(/\s/g, '') === ''
      const isEmptyArray = Array.isArray(value) && value.length === 0
      const isEmptyObject = isPlainObject(value) && Object.keys(value).length === 0
      let isEmpty = isUndefined || isNull || isEmptyString || isEmptyArray || isEmptyObject
      if (params.clean === CLEAN_ENUM.CLEAN_UNDEFINED) {
        isEmpty = isUndefined
      } else if (params.clean === CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL) {
        isEmpty = isUndefined || isNull
      } else if (params.clean === CLEAN_ENUM.CLEAN_DIRTY) {
        isEmpty = isUndefined || isNull || isEmptyString || isEmptyArray || isEmptyObject
      }
      const serializeName = getColumnSerializeName(columns[key], sns)
      const emptyValueRaw = columns[key].emptyValue as string | (() => any)
      const emptyValue = typeof emptyValueRaw === 'function' ? emptyValueRaw() : emptyValueRaw
      if (columns[key].childType) {
        // 如果原始数据中没有这个字段，则不存入saveData
        if (value) {
          if (Array.isArray(value)) {
            dto[serializeName] = []
            value.forEach((m: any) => {
              dto[serializeName].push(modelToSerializableObj(m, params))
            })
          } else {
            if (columns[key].type === 'record') {
              Object.keys(value || {}).forEach((k) => {
                dto[serializeName] = dto[serializeName] || {}
                dto[serializeName][k] = modelToSerializableObj(target[key][k], params)
              })
            } else if (columns[key].type === 'recordArray') {
              Object.keys(value || {}).forEach((k) => {
                dto[serializeName] = dto[serializeName] || {}
                value[k]?.forEach((m: any) => {
                  dto[serializeName][k] = dto[serializeName][k] || []
                  dto[serializeName][k].push(modelToSerializableObj(m, params))
                })
              })
            } else {
              dto[serializeName] = modelToSerializableObj(value, params)
            }
          }
          if (isEmpty) {
            delete dto[serializeName]
            if (typeof emptyValue !== 'undefined' && params?.enableEmptyValue === true) {
              dto[serializeName] = emptyValue
            }
          }
        }
      } else {
        let value = target[key]
        // 处理any类型的数据，解除对普通对象的数据的引用。
        if (typeof value !== 'undefined' && value !== null) {
          value = cloneDeep(value)
        }
        const serialize = columns[key].unformatter || columns[key].serialize
        if (typeof serialize === 'function') {
          const paramsSerialize: IColumnSerialize<T> = {
            value: target[key],
            name: serializeName,
            property: key,
            deserializeData: target,
            column: columns[key],
          }
          value = serialize.apply(target, [paramsSerialize])
        }

        // if (params.clean === CLEAN_ENUM.CLEAN_DIRTY) {
        //   cleanDirty(this_, key, dto, serializeName, value)
        // } else if (params.clean === CLEAN_ENUM.CLEAN_UNDEFINED) {
        //   // 默认null或者undefined的字段会包含在返回的对象中，如果需要返回对象不返回null和undefined的值，调用方法时传true
        //   if (typeof target[key] !== 'undefined') {
        //     dto[serializeName] = value
        //   }
        // } else if (params.clean === CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL) {
        //   // 默认null或者undefined的字段会包含在返回的对象中，如果需要返回对象不返回null和undefined的值，调用方法时传true
        //   if (typeof target[key] !== 'undefined' && target[key] !== null) {
        //     dto[serializeName] = value
        //   }
        // } else {
        //   dto[serializeName] = value
        // }
        if (columns[key].trim && params.trim && typeof value === 'string') {
          value = (value as string).trim()
        }
        if (isEmpty) {
          if (typeof emptyValue !== 'undefined' && params?.enableEmptyValue === true) {
            dto[serializeName] = emptyValue
          }
        } else {
          dto[serializeName] = value
        }
      }
      // todo 后续可以再兼容group是数组的情况
      // 处理分组的逻辑 begin
      if (typeof params.group !== 'undefined') {
        // console.log('param.group', columns[key].group, param.group)
        // 如果有分组，必须返回分组中的数据。
        // 此处的逻辑是把非当前分组的数据剔除掉。
        if (columns[key].group) {
          // console.log('group', columns[key].group)
          // console.log('param.group', param.group)
        }
        if (columns[key].group?.indexOf(params.group) === -1) {
          // console.log('delete', columns[key].group, param.group)
          delete dto[serializeName]
        }
      } else if (typeof params.excludeGroup !== 'undefined') {
        if (
          typeof params.excludeGroup === 'string' &&
          columns[key].group &&
          columns[key].group?.indexOf?.(params.excludeGroup) !== -1
        ) {
          delete dto[serializeName]
        } else if (
          Array.isArray(params.excludeGroup) &&
          params.excludeGroup.some((group) => columns[key].group && columns[key].group?.indexOf?.(group) !== -1)
        ) {
          delete dto[serializeName]
        }
      }
      // 处理分组的逻辑 end
    }
  }
  return dto
}
