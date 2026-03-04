/**
 * 模型数据操作核心工具
 *
 * 提供模型的创建、更新、反序列化等核心功能。
 * 处理 DTO 数据到模型实例的转换，支持嵌套模型、数组、Record 等复杂结构。
 *
 * @author shuai.meng
 * @since 2017/8/2
 */

import { cloneDeep } from 'lodash'
import type {
  IColumnDefault,
  IColumnDeserialize,
  IColumnInner,
  IModelOptions,
  IModelUpdateOptions,
} from '../decorator/types'
import { ModelBase } from '../model/ModelBase'
import { deserializeRecord, deserializeRecordArray } from '../tools/methods'
import { create } from './create'
import { getColumnSerializeName } from './getColumnSerializeName'
import { getModelProps } from './ModelBaseProps'

/**
 * 简单深拷贝实现
 *
 * 仅处理普通对象和数组，不处理特殊对象（Date、RegExp 等）。
 * 用于简单场景下避免 lodash 的完整深拷贝开销。
 *
 * @param aObject - 要拷贝的对象
 * @returns 深拷贝后的新对象
 *
 * @deprecated 建议使用 lodash.cloneDeep 以获得更完整的深拷贝支持
 */
export function deepCopy(aObject: any) {
  if (!aObject) {
    return aObject
  }

  let v
  const bObject = Array.isArray(aObject) ? [] : ({} as any)
  for (const k in aObject) {
    v = aObject[k]
    bObject[k] = Object.prototype.toString.call(v) === '[object Object]' ? deepCopy(v) : v
  }

  return bObject
}

/**
 * 从 DTO 中获取反序列化的属性值
 *
 * 根据配置的命名策略，从 DTO 对象中查找对应的值。
 * 支持主名称和别名，以及蛇形/驼峰命名的自动适配。
 *
 * 查找顺序：
 * 1. 按命名策略查找主名称（name/camelCaseName）
 * 2. 如果未找到且定义了别名，查找别名（aliasName/camelCaseAliasName）
 *
 * @param model - 模型实例
 * @param dto - 原始 DTO 数据
 * @param field - 列配置
 * @param options - 模型选项
 * @returns DTO 中对应的值
 */
function getDeserializeDtoValue<T extends ModelBase>(
  model: T,
  dto: any,
  field: IColumnInner<T>,
  options?: IModelOptions,
) {
  const dns = getModelProps(model, 'deserializeNamingStrategies', options?.current)
  let retData: any

  // 根据命名策略查找主名称
  if (dns === 'mix') {
    // 混合模式：优先蛇形，其次驼峰
    if (Object.prototype.hasOwnProperty.call(dto, field.name) && typeof dto[field.name] !== 'undefined') {
      retData = dto[field.name]
    } else if (
      Object.prototype.hasOwnProperty.call(dto, field.camelCaseName) &&
      typeof dto[field.camelCaseName] !== 'undefined'
    ) {
      retData = dto[field.camelCaseName]
    }
  } else if (dns === 'camelCase') {
    if (
      Object.prototype.hasOwnProperty.call(dto, field.camelCaseName) &&
      typeof dto[field.camelCaseName] !== 'undefined'
    ) {
      retData = dto[field.camelCaseName]
    }
  } else {
    retData = dto[field.name]
  }

  // 主名称未找到时，尝试使用别名
  if (typeof retData === 'undefined' && field.aliasName && field.camelCaseAliasName) {
    if (dns === 'mix') {
      if (Object.prototype.hasOwnProperty.call(dto, field.aliasName) && typeof dto[field.aliasName] !== 'undefined') {
        retData = dto[field.aliasName]
      } else if (
        Object.prototype.hasOwnProperty.call(dto, field.camelCaseAliasName) &&
        typeof dto[field.camelCaseAliasName] !== 'undefined'
      ) {
        retData = dto[field.camelCaseAliasName]
      }
    } else if (dns === 'camelCase') {
      if (
        Object.prototype.hasOwnProperty.call(dto, field.camelCaseAliasName) &&
        typeof dto[field.camelCaseAliasName] !== 'undefined'
      ) {
        retData = dto[field.camelCaseAliasName]
      }
    } else {
      retData = dto[field.aliasName]
    }
  }
  return retData
}

/**
 * 生成列的默认值
 *
 * 如果 default 是函数，则调用函数获取默认值；否则直接返回默认值。
 *
 * @param model - 模型实例
 * @param column - 列配置
 * @param modelDTO - 原始 DTO 数据
 * @param key - 属性名
 * @param options - 模型选项
 * @returns 列的默认值
 */
function genColumnDefault<T extends ModelBase>(
  model: T,
  column: IColumnInner<T>,
  modelDTO: any,
  key: string,
  options?: IModelOptions,
) {
  const sns = getModelProps(model, 'serializeNamingStrategies', options?.current)
  if (typeof column.default === 'function') {
    const paramsDefault: IColumnDefault<T> = {
      name: getColumnSerializeName(column, sns),
      property: key,
      data: modelDTO,
      column,
    }
    return column.default.apply(null, [paramsDefault])
  } else {
    return column.default
  }
}

/**
 * 设置列的默认值
 *
 * 根据列配置的 default 或 autowired 属性，为模型属性设置默认值。
 * 支持的默认值类型：
 * - 函数：调用函数获取动态默认值
 * - true：根据类型自动创建（Array → []，Object → {}，childType → 子模型实例）
 * - 其他值：直接使用
 *
 * @param model - 模型实例
 * @param column - 列配置
 * @param key - 属性名
 * @param modelDTO - 原始 DTO 数据
 * @param options - 模型选项
 */
function setDefault<T extends ModelBase>(
  model: T,
  column: IColumnInner<T>,
  key: keyof T,
  modelDTO: any,
  options?: IModelOptions,
) {
  if (typeof column.default === 'undefined' && typeof column.autowired === 'undefined') {
    model[key] = undefined as (typeof model)[keyof T]
  } else {
    // autowired=true 或 default=true 时，根据类型自动创建默认值
    if (column.default === true || column.autowired === true) {
      if (column.type === Array) {
        model[key] = (() => {
          return []
        })() as (typeof model)[keyof T]
      } else if (column.type === Object) {
        model[key] = (() => {
          return {}
        })() as (typeof model)[keyof T]
      } else if (column.childType) {
        model[key] = create<T>(column.childType)({}, options) as (typeof model)[keyof T]
      } else {
        model[key] = genColumnDefault(model, column, modelDTO, key as string, options)
      }
    } else {
      model[key] = genColumnDefault(model, column, modelDTO, key as string, options)
    }
  }
}

/**
 * 获取反序列化后的值
 *
 * 如果列配置了 deserialize/formatter 函数，则调用该函数进行转换；
 * 否则直接返回 DTO 中的原始值。
 *
 * @param model - 模型实例
 * @param column - 列配置
 * @param modelDTO - 原始 DTO 数据
 * @param options - 模型选项
 * @returns 反序列化后的值
 */
function getDeserializeValue<T extends ModelBase>(
  model: T,
  column: IColumnInner<T>,
  modelDTO: any,
  options?: IModelOptions,
) {
  const sns = getModelProps(model, 'deserializeNamingStrategies', options?.current)
  const deserialize = column.deserialize || column.formatter
  if (typeof deserialize === 'function') {
    const paramsDeserialize: IColumnDeserialize<T> = {
      value: getDeserializeDtoValue(model, modelDTO, column, options),
      name: getColumnSerializeName(column, sns),
      property: column.property,
      serializeData: modelDTO,
      column,
    }
    return deserialize.apply(model, [paramsDeserialize])
  } else {
    return getDeserializeDtoValue(model, modelDTO, column)
  }
}

/**
 * 创建嵌套子模型
 *
 * 根据列的 childType 配置，将 DTO 数据转换为子模型实例。
 * 支持以下类型：
 * - 数组：转换为子模型实例数组
 * - record：转换为 { [key: string]: ChildModel } 结构
 * - recordArray：转换为 { [key: string]: ChildModel[] } 结构
 * - 单个对象：转换为单个子模型实例
 *
 * @param model - 父模型实例
 * @param field - 列配置
 * @param key - 属性名
 * @param modelDTO - 原始 DTO 数据
 * @param options - 模型选项
 * @returns 子模型实例或实例集合
 */
export function createChildField<T extends ModelBase>(
  model: T,
  field: IColumnInner<T>,
  key: keyof T,
  modelDTO: any,
  options?: IModelOptions,
) {
  const deserializeValue = getDeserializeValue(model, field, modelDTO, options)
  if (Array.isArray(deserializeValue)) {
    const arr: any[] = (() => {
      return []
    })()
    deserializeValue.forEach((itemDTO: any) => {
      arr.push(create<T>(field.childType)(itemDTO, options))
    })
    return arr
  } else {
    if (field.type === 'record') {
      return deserializeRecord(field.childType, deserializeValue, options)
    } else if (field.type === 'recordArray') {
      return deserializeRecordArray(field.childType, deserializeValue, options)
    }
    return create<T>(field.childType)(deserializeValue, options)
  }
}

/**
 * @description 更新数组对象的值
 * @param field
 * @param model
 * @param columnName
 * @param data
 * @param options
 */
function updateArrField<T extends ModelBase>(
  field: IColumnInner<T>,
  model: T,
  columnName: keyof T,
  data: any,
  options?: IModelOptions,
) {
  const arrDto = getDeserializeDtoValue(model, data, field)
  if (typeof arrDto !== 'undefined') {
    if (arrDto.length) {
      arrDto.forEach((dto: any) => {
        let find = false
        if ((model as T)[columnName] && Array.isArray((model as T)[columnName])) {
          ;((model as T)[columnName] as any[]).forEach((item: any) => {
            if (item.getPrimaryValue().join(',') === item.getPrimaryValueFromData(dto).join(',')) {
              item.update(dto)
              find = true
            }
          })
          if (!find) {
            ;(model as any)[columnName].push(create<T>(field.childType)(dto, options))
          }
        } else {
          ;(model as any)[columnName] = []
          ;(model as any)[columnName].push(create<T>(field.childType)(dto, options))
        }
      })
    } else {
      ;(model as any)[columnName] = []
    }
  }
}

function updateForeign<T extends ModelBase>(
  field: IColumnInner<T>,
  model: T,
  columnName: keyof T,
  data: any,
  columnDto: any,
  options?: IModelOptions,
) {
  // 带 foreign 属性的对象会强制校验主键一致
  if ((model[columnName] as ModelBase).getPrimaryValueFromData(columnDto.join(','))) {
    // 判断之前是否有值，如果没有值则创建
    if (model[columnName]) {
      // 判断之前的值是否和新的值相等，一致则更新
      if (
        (model[columnName] as any).getPrimaryValue().join(',') ===
        (model[columnName] as any).getPrimaryValueFromData(columnDto).join(',')
      ) {
        ;(model[columnName] as any).update(getDeserializeDtoValue(model, data, field))
      }
    } else {
      ;(model[columnName] as any) = create<T>(field.childType)(columnDto, options)
    }
  }
}

/**
 * @description 初始化所有 column 对应的值
 *
 * @param flag
 * @param columnName
 * @param model
 * @param columns
 * @param data
 * @param options
 */
function initField<T extends ModelBase>(
  flag: string,
  columnName: keyof T,
  model: T,
  columns: { [key: string]: IColumnInner<T> },
  data: any,
  options?: IModelOptions,
) {
  const field = columns[columnName as string]
  const columnDto = getDeserializeDtoValue(model, data, field)
  if (flag === 'create') {
    if (typeof columnDto !== 'undefined') {
      if (field.childType) {
        ;(model as any)[columnName] = createChildField<T>(model, field, columnName, data, options)
      } else {
        if (Array.isArray(getDeserializeDtoValue(model, data, field))) {
          ;(model as any)[columnName] = getDeserializeValue<T>(model, field, cloneDeep(data))
        } else {
          ;(model as any)[columnName] = getDeserializeValue<T>(model, field, data)
        }
      }
    } else {
      if (!getModelProps(model, 'noDefault', options?.current)) {
        setDefault<T>(model, field, columnName, data, options)
      }
    }
  } else if (flag === 'update') {
    if (typeof columnDto !== 'undefined') {
      if (field.childType) {
        if (Array.isArray(getDeserializeDtoValue(model, data, field))) {
          updateArrField<T>(field, model, columnName, data, options)
        } else if (field.foreign) {
          updateForeign<T>(field, model, columnName, data, columnDto, options)
        } else {
          if (typeof (model as any)[columnName] !== 'undefined' && (model as any)[columnName].update) {
            ;(model as any)[columnName].update(columnDto)
          } else {
            ;(model as any)[columnName] = create(field.childType)(columnDto, options)
          }
        }
      } else {
        ;(model as any)[columnName] = getDeserializeValue(model, field, data)
      }
    }
  }
}

function setModelByDTO<T extends ModelBase>(
  flag: string,
  model: T,
  props: { [key: string]: IColumnInner<T> },
  modelDTO: any,
  options?: IModelOptions,
) {
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      // 如果没有分组，或者符合当前分组的时候，需要赋值。
      if (
        (typeof options?.group !== 'undefined' &&
          props[key].group &&
          props[key].group?.indexOf(options?.group as string) !== -1) ||
        !options?.group
      ) {
        initField<T>(flag, key as keyof T, model, props, modelDTO, options)
      } else if (
        (typeof options?.excludeGroup !== 'undefined' &&
          props[key].group &&
          props[key].group?.indexOf(options?.excludeGroup as string) === -1) ||
        !options?.group
      ) {
        initField<T>(flag, key as keyof T, model, props, modelDTO, options)
      }
    }
  }
}

/**
 * 根据 DTO 创建模型数据
 *
 * 将 DTO 数据映射到模型实例的各个属性上，并保存初始状态快照用于变更追踪。
 * 这是模型初始化的核心方法。
 *
 * @param model - 模型实例
 * @param props - 列配置映射
 * @param dto - 原始 DTO 数据
 * @param options - 模型选项
 */
export function createModelByDTO<T extends ModelBase>(model: T, props: any, dto: any, options?: IModelOptions) {
  const modelDTO: { [index: string]: any } = dto || {}
  setModelByDTO('create', model, props, modelDTO, options)
  model.saveChangedData({
    group: options?.group,
    enableDataState: getModelProps(model, 'enableDataState', options?.current),
  })
}

/**
 * 扩展模型数据（不重置变更追踪状态）
 *
 * 类似 createModelByDTO，但不会重置变更追踪的基准点。
 * 用于在保留原有变更历史的情况下扩展模型数据。
 *
 * @param model - 模型实例
 * @param props - 列配置映射
 * @param dto - 原始 DTO 数据
 * @param options - 模型选项
 */
export function extendModelByDTO<T extends ModelBase>(model: T, props: any, dto: any, options?: IModelOptions) {
  const modelDTO: { [index: string]: any } = dto || {}
  setModelByDTO('create', model, props, modelDTO, options)
}

/**
 * 更新模型数据
 *
 * 对已存在的模型实例进行增量更新，仅更新 DTO 中存在的属性。
 * 支持嵌套模型的递归更新，通过主键匹配数组项进行智能合并。
 *
 * @param model - 模型实例
 * @param props - 列配置映射
 * @param dto - 更新的 DTO 数据
 * @param options - 模型选项
 */
export function updateModelByDTO<T extends ModelBase>(model: T, props: any, dto: any, options?: IModelUpdateOptions) {
  const modelDTO: { [index: string]: any } = dto || {}
  setModelByDTO('update', model, props, modelDTO, options)
  model.saveChangedData({
    group: options?.group,
    enableDataState: getModelProps(model, 'enableDataState', options?.current),
  })
}
