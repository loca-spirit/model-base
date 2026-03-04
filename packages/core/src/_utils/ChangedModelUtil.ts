/**
 * 模型变更检测工具
 *
 * 提供模型数据变更的检测和描述功能，支持：
 * - 基本类型变更检测
 * - 嵌套对象变更检测
 * - 数组项的增删改检测（基于主键匹配）
 * - 分组过滤
 */

import { isPlainObject } from 'lodash'
import { NAMING_STRATEGIES } from '../constant'
import { CLEAN_ENUM, IColumnInner } from '../decorator/types'
import { ModelBase } from '../model/ModelBase'
import { create, getModelType } from './create'
import { getModelProps } from './ModelBaseProps'

/**
 * 变更描述对象的类型定义
 */
interface ChangeDescriptor {
  /** 变更动作：删除、创建、更新 */
  action: 'DELETE' | 'CREATE' | 'UPDATE'
  /** 数据键名（序列化后的名称） */
  dataKey: any
  /** 当前值 */
  currentValue: any
  /** 原始值 */
  oldValue: any
  /** 基于主键的变更描述（用于数组和嵌套对象） */
  primaryChangeDescriptor?: {
    create: any
    delete: any
    update: any
    noChange?: any
  }
  /** 简单变更描述 */
  changeDescriptor: {
    create?: any
    delete?: any
    update?: any
  }
}

/**
 * 获取模型的变更数据
 *
 * 对比当前模型数据与原始快照，返回变更的属性及其新旧值。
 *
 * @param columns - 列配置映射
 * @param target - 模型实例
 * @param targetData - 当前序列化后的数据
 * @param params - 配置参数
 * @param params.group - 仅包含指定分组的列
 * @param params.excludeGroup - 排除指定分组的列
 * @param params.trim - 是否去除字符串首尾空格后比较
 * @param params.descriptor - 是否返回详细变更描述
 * @param params.clean - 空值清理策略
 * @param params.ignoreEmptyString - 是否忽略空字符串变更
 * @param params.ignoreEmpty - 是否忽略所有空值变更
 * @param params.enableEmptyValue - 是否使用 emptyValue 替代空值
 * @param params.camelCase - 是否使用驼峰命名
 *
 * @returns 变更数据对象，或变更描述对象（当 descriptor=true）
 */
export function getChange(
  columns: { [key: string]: IColumnInner },
  target: ModelBase,
  targetData: any,
  params: {
    group?: string
    excludeGroup?: string
    trim?: boolean
    descriptor?: boolean
    clean?: CLEAN_ENUM
    ignoreEmptyString?: boolean
    ignoreEmpty?: boolean
    enableEmptyValue?: boolean
    camelCase?: boolean
  },
) {
  const sns =
    (typeof params.camelCase === 'boolean'
      ? params.camelCase
        ? NAMING_STRATEGIES.camelCase
        : NAMING_STRATEGIES.snakeCase
      : null) ?? getModelProps(target, 'serializeNamingStrategies')
  const changedObj = {} as { [key: string]: any }
  const descriptorObj = {} as {
    [key: string]: {
      action: 'DELETE' | 'CREATE' | 'UPDATE'
      dataKey: any
      currentValue: any
      oldValue: any
      primaryChangeDescriptor?: {
        create: any
        delete: any
        update: any
      }
      changeDescriptor: {
        create?: any
        delete?: any
        update?: any
      }
    }
  }
  Object.keys(columns).forEach((columnName) => {
    let orgColumn = columns[columnName].name
    const emptyValueRaw = columns[columnName].emptyValue as string | (() => any)
    const emptyValue = typeof emptyValueRaw === 'function' ? emptyValueRaw() : emptyValueRaw
    if (sns === NAMING_STRATEGIES.camelCase) {
      orgColumn = columns[columnName].camelCaseName
    }
    let currentValue = targetData[orgColumn]
    if (columns[columnName].trim && params.trim && typeof currentValue === 'string') {
      currentValue = (currentValue as string).trim()
    }
    let oldValue = target.getOriginalData()[orgColumn]
    if (columns[columnName].trim && params.trim && typeof oldValue === 'string') {
      oldValue = (oldValue as string).trim()
    }
    // 处理删除的数据，对删除数据进行格式化，满足不同的需求
    const isUndefined = currentValue === void 0
    const isNull = currentValue === null
    const isEmptyString = typeof currentValue === 'string' && currentValue.replace(/\s/g, '') === ''
    const isEmptyArray = Array.isArray(currentValue) && currentValue.length === 0
    const isEmptyObject = isPlainObject(currentValue) && Object.keys(currentValue).length === 0
    let isEmpty = isUndefined || isNull || isEmptyString || isEmptyArray || isEmptyObject
    if (params.clean === CLEAN_ENUM.CLEAN_UNDEFINED) {
      isEmpty = isUndefined
    } else if (params.clean === CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL) {
      isEmpty = isUndefined || isNull
    } else if (params.clean === CLEAN_ENUM.CLEAN_DIRTY) {
      isEmpty = isUndefined || isNull || isEmptyString || isEmptyArray || isEmptyObject
    }
    let currentValue_ = currentValue
    const isChanged = JSON.stringify(oldValue) !== JSON.stringify(currentValue)
    // 有变化的时候才去设置 emptyValue
    if (isEmpty && isChanged && typeof emptyValue !== 'undefined' && params?.enableEmptyValue === true) {
      currentValue_ = emptyValue
    }
    if (isEmpty && isChanged) {
      changedObj[orgColumn] = currentValue_
      descriptorObj[columnName] = {
        dataKey: orgColumn,
        currentValue: currentValue_,
        oldValue,
        action: 'DELETE',
        changeDescriptor: {
          create: undefined,
          delete: oldValue,
          update: currentValue_,
        },
      }
    } else if (oldValue === void 0 && isChanged) {
      if (params?.ignoreEmptyString && typeof currentValue === 'string' && currentValue === '') {
        // 这种情况不处理，认为是无变化。
      } else if (params?.ignoreEmpty && isEmpty) {
        // 这种情况不处理，认为是无变化。
      } else {
        // 处理新增的数据
        changedObj[orgColumn] = currentValue_
        descriptorObj[columnName] = {
          dataKey: orgColumn,
          currentValue: currentValue_,
          oldValue,
          action: 'CREATE',
          changeDescriptor: {
            create: currentValue_,
            delete: undefined,
            update: undefined,
          },
        }
      }
    } else {
      // 处理变更的数据
      if (isPlainObject(oldValue)) {
        if (isChanged) {
          changedObj[orgColumn] = currentValue_
        }
        const insObj = target as any
        const insChild = insObj[columnName] as ModelBase
        const childType = columns[columnName].childType
        // 普通对象没有 getPrimaryKey 方法
        if (
          childType &&
          insChild.getPrimaryKey().length &&
          insChild.getPrimaryValue().join(',') !== insChild.getPrimaryValueFromData(oldValue).join(',')
        ) {
          // primary value changed
          descriptorObj[columnName] = descriptorObj[columnName] || ({} as any)
          descriptorObj[columnName].primaryChangeDescriptor = {
            create: currentValue_,
            delete: oldValue,
            update: undefined,
          } as any
        } else {
          if (isChanged) {
            descriptorObj[columnName] = descriptorObj[columnName] || ({} as any)
            descriptorObj[columnName].primaryChangeDescriptor = {
              create: undefined,
              delete: undefined,
              update: currentValue_,
            } as any
          }
        }
      } else if (Array.isArray(oldValue)) {
        if (isChanged) {
          changedObj[orgColumn] = currentValue_
        }
        const childType = getModelType(columns[columnName].childType)

        if (childType && (childType as any)?.prototype?.getPrimaryKey) {
          const hasPrimaryKey = create(childType)().getPrimaryKey().length
          if (hasPrimaryKey) {
            const matchedCurValueList = [] as any[]
            let foundCurrentItemValue: any
            let notFoundCurrentItemValue: any
            const primaryChangeDescriptor = {
              create: [],
              delete: [],
              update: [],
              noChange: [],
            } as {
              create: any[]
              delete: any[]
              update: any[]
              noChange: any[]
            }
            oldValue?.forEach((oldItemValue: any) => {
              let founded = false
              notFoundCurrentItemValue = oldItemValue
              currentValue?.forEach((currentItemValue: any, i: number) => {
                const ins = target as any
                const childIns = ins[columnName][i] as ModelBase
                if (childIns.getPrimaryValue().join(',') === childIns.getPrimaryValueFromData(oldItemValue).join(',')) {
                  foundCurrentItemValue = currentItemValue
                  founded = true
                  matchedCurValueList.push(foundCurrentItemValue)
                }
              })
              if (founded) {
                if (JSON.stringify(oldItemValue) !== JSON.stringify(foundCurrentItemValue)) {
                  primaryChangeDescriptor.update.push(foundCurrentItemValue)
                } else {
                  primaryChangeDescriptor.noChange.push(foundCurrentItemValue)
                }
              } else {
                primaryChangeDescriptor.delete.push(notFoundCurrentItemValue)
              }
            })
            let notFoundedCurValue: any
            currentValue?.forEach((currentItemValue: any) => {
              let foundedCreate = false
              notFoundedCurValue = currentItemValue
              matchedCurValueList.forEach((matchedCurValue) => {
                if (JSON.stringify(matchedCurValue) === JSON.stringify(currentItemValue)) {
                  foundedCreate = true
                }
              })
              if (!foundedCreate) {
                primaryChangeDescriptor.create.push(notFoundedCurValue)
              }
            })

            if (
              primaryChangeDescriptor.noChange.length ||
              primaryChangeDescriptor.delete.length ||
              primaryChangeDescriptor.update.length ||
              primaryChangeDescriptor.create.length
            ) {
              descriptorObj[columnName] = descriptorObj[columnName] || ({} as any)
              descriptorObj[columnName].primaryChangeDescriptor = primaryChangeDescriptor
            }
          }
        }
      }
      if (isChanged) {
        changedObj[orgColumn] = currentValue_
        descriptorObj[columnName] = descriptorObj[columnName] || ({} as any)
        Object.assign(descriptorObj[columnName], {
          dataKey: orgColumn,
          currentValue: currentValue_,
          oldValue,
        })
        descriptorObj[columnName].changeDescriptor = {
          // create: undefined,
          // delete: undefined,
          update: currentValue_,
        }
        descriptorObj[columnName].action = 'UPDATE'
      }
    }
    if (typeof params.group !== 'undefined') {
      // 如果有分组，必须返回分组中的数据。
      // 此处的逻辑是把非当前分组的数据剔除掉。
      if (columns[columnName].group && columns[columnName].group?.indexOf(params.group as string) === -1) {
        if (params && params.descriptor) {
          delete descriptorObj[orgColumn]
        } else {
          delete changedObj[orgColumn]
        }
      }
    } else if (typeof params.excludeGroup !== 'undefined') {
      // 如果有分组，必须返回分组中的数据。
      // 此处的逻辑是把非当前分组的数据剔除掉。
      if (columns[columnName].group && columns[columnName].group?.indexOf(params.excludeGroup as string) !== -1) {
        if (params && params.descriptor) {
          delete descriptorObj[orgColumn]
        } else {
          delete changedObj[orgColumn]
        }
      }
    }
  })
  if (params && params.descriptor) {
    return descriptorObj
  }
  return changedObj
}
