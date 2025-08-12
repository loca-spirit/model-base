import { cloneDeep, isPlainObject } from 'lodash'
import { getColumnSerializeName } from '../_utils/getCollumnSerializeName'
import { getModelProps } from '../_utils/ModelBaseProps'
import { NAMING_STRATEGIES } from '../constant'
import { CLEAN_ENUM, IColumnSerialize, type IColumnInner, type TSerializableParam } from '../decorator/types'
import { type ModelBase } from '../model/ModelBase'

function cleanDirty(this_: any, key: string, dto: { [index: string]: any }, columnName: string, value: any) {
  const target = this_ as any
  // 默认null或者undefined的字段会包含在返回的对象中，如果需要返回对象不返回null、空和undefined的值，调用方法时传 'cleanDirty'
  if (typeof target[key] === 'string') {
    if (target[key].replace(/\s/g, '') !== '') {
      dto[columnName] = value
    }
  } else if (isPlainObject(target[key])) {
    if (Object.keys(target[key]).length !== 0) {
      dto[columnName] = value
    }
  } else if (Array.isArray(target[key])) {
    if (target[key].length !== 0) {
      dto[columnName] = value
    }
  } else {
    if (typeof target[key] !== 'undefined' && target[key] !== null) {
      dto[columnName] = value
    }
  }
}
/**
 *
 * 如果 removeUndefinedAndNullValue 设置为 true，则 undefined 和 null 的值是获取不到的，
 * 如果你设置了某个属性值为，''，这个属性是可以的值是可以获取到为 '' 的，如果你不想要这个属性的值，
 * 请设置这个属性为 undefined，或者删除掉这个属性的 key
 *
 * @param this_
 * @param param
 * @return { { [index: string]: any } }
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
      const serializeName = getColumnSerializeName(columns[key], sns)
      if (columns[key].childType) {
        // 如果原始数据中没有这个字段，则不存入saveData
        if (target[key]) {
          if (Array.isArray(target[key])) {
            dto[serializeName] = []
            target[key].forEach((m: any) => {
              dto[serializeName].push(modelToSerializableObj(m, params))
            })
            if (params.clean === CLEAN_ENUM.CLEAN_DIRTY) {
              if (dto[serializeName] && dto[serializeName].length === 0) {
                delete dto[serializeName]
              }
            }
          } else {
            if (columns[key].type === 'record') {
              Object.keys(target[key] || {}).forEach((k) => {
                dto[serializeName] = dto[serializeName] || {}
                dto[serializeName][k] = modelToSerializableObj(target[key][k], params)
              })
            } else if (columns[key].type === 'recordArray') {
              Object.keys(target[key] || {}).forEach((k) => {
                dto[serializeName] = dto[serializeName] || {}
                target[key][k]?.forEach((m: any) => {
                  dto[serializeName][k] = dto[serializeName][k] || []
                  dto[serializeName][k].push(modelToSerializableObj(m, params))
                })
              })
            } else {
              dto[serializeName] = modelToSerializableObj(target[key], params)
              if (params.clean === CLEAN_ENUM.CLEAN_DIRTY) {
                if (dto[serializeName] && Object.keys(dto[serializeName]).length === 0) {
                  delete dto[serializeName]
                }
              }
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
        if (params.clean === CLEAN_ENUM.CLEAN_DIRTY) {
          cleanDirty(this_, key, dto, serializeName, value)
        } else if (params.clean === CLEAN_ENUM.CLEAN_UNDEFINED) {
          // 默认null或者undefined的字段会包含在返回的对象中，如果需要返回对象不返回null和undefined的值，调用方法时传true
          if (typeof target[key] !== 'undefined') {
            dto[serializeName] = value
          }
        } else if (params.clean === CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL) {
          // 默认null或者undefined的字段会包含在返回的对象中，如果需要返回对象不返回null和undefined的值，调用方法时传true
          if (typeof target[key] !== 'undefined' && target[key] !== null) {
            dto[serializeName] = value
          }
        } else {
          dto[serializeName] = value
        }
        if (columns[key].trim && params.trim && typeof dto[serializeName] === 'string') {
          dto[serializeName] = (dto[serializeName] as string).trim()
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
          columns[key].group && columns[key].group?.indexOf?.(params.excludeGroup) !== -1
        ) {
          delete dto[serializeName]
        } else if (
          Array.isArray(params.excludeGroup) &&
          params.excludeGroup.some((group) =>  columns[key].group && columns[key].group?.indexOf?.(group) !== -1)
        ) {
          delete dto[serializeName]
        }
      }
      // 处理分组的逻辑 end
    }
  }
  return dto
}
