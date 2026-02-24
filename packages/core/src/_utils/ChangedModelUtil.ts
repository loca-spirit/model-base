import { isPlainObject } from 'lodash'
import { NAMING_STRATEGIES } from '../constant'
import { CLEAN_ENUM, IColumnInner } from '../decorator/types'
import { ModelBase } from '../model/ModelBase'
import { create, getModelType } from './create'
import { getModelProps } from './ModelBaseProps'

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
    const emptyValue = columns[columnName].emptyValue
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
    if (isEmpty && typeof emptyValue !== 'undefined' && params?.enableEmptyValue === true) {
      currentValue = emptyValue
    }
    if (isEmpty && JSON.stringify(oldValue) !== JSON.stringify(currentValue)) {
      changedObj[orgColumn] = currentValue
      descriptorObj[columnName] = {
        dataKey: orgColumn,
        currentValue,
        oldValue,
        action: 'DELETE',
        changeDescriptor: {
          create: undefined,
          delete: oldValue,
          update: currentValue,
        },
      }
    } else if (oldValue === void 0 && JSON.stringify(oldValue) !== JSON.stringify(currentValue)) {
      if (params?.ignoreEmptyString && typeof currentValue === 'string' && currentValue === '') {
        // 这种情况不处理，认为是无变化。
      } else if (params?.ignoreEmpty && isEmpty) {
        // 这种情况不处理，认为是无变化。
      } else {
        // 处理新增的数据
        changedObj[orgColumn] = currentValue
        descriptorObj[columnName] = {
          dataKey: orgColumn,
          currentValue,
          oldValue,
          action: 'CREATE',
          changeDescriptor: {
            create: currentValue,
            delete: undefined,
            update: undefined,
          },
        }
      }
    } else {
      // 处理变更的数据
      if (isPlainObject(oldValue)) {
        const oldValueStr = JSON.stringify(oldValue)
        const currentValueStr = JSON.stringify(currentValue)
        if (oldValueStr !== currentValueStr) {
          changedObj[orgColumn] = currentValue
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
            create: currentValue,
            delete: oldValue,
            update: undefined,
          } as any
        } else {
          if (oldValueStr !== currentValueStr) {
            descriptorObj[columnName] = descriptorObj[columnName] || ({} as any)
            descriptorObj[columnName].primaryChangeDescriptor = {
              create: undefined,
              delete: undefined,
              update: currentValue,
            } as any
          }
        }
      } else if (Array.isArray(oldValue)) {
        const oldValueStr = JSON.stringify(oldValue)
        const currentValueStr = JSON.stringify(currentValue)
        if (oldValueStr !== currentValueStr) {
          changedObj[orgColumn] = currentValue
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
      if (JSON.stringify(oldValue) !== JSON.stringify(currentValue)) {
        changedObj[orgColumn] = currentValue
        descriptorObj[columnName] = descriptorObj[columnName] || ({} as any)
        Object.assign(descriptorObj[columnName], {
          dataKey: orgColumn,
          currentValue,
          oldValue,
        })
        descriptorObj[columnName].changeDescriptor = {
          // create: undefined,
          // delete: undefined,
          update: currentValue,
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
