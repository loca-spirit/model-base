import merge from 'deepmerge'
import { cloneDeep } from 'lodash'
import { getChange } from '../_utils/ChangedModelUtil'
import { getModelProps, initModelOptions } from '../_utils/ModelBaseProps'
import { createModelByDTO, deepCopy, extendModelByDTO, updateModelByDTO } from '../_utils/ModelBaseUtil'
import { toRaw } from '../_utils/toRaw'
import { __CLONE__, __COLUMNS__, __COLUMNS_CACHED__, __MODEL__, NAMING_STRATEGIES } from '../constant'
import { generateColumnsFromData } from '../decorator/Column'
import { CLEAN_ENUM, IColumnInner, IDataModel, IModelOptions, ModelType } from '../decorator/types'
import { modelToSerializableObj } from '../tools/modelToSerializableObj'

export interface IDataByOriginalOption extends IModelOptions {
  keepBackUp?: boolean
}

function callMethod(
  this_: any,
  param: {
    method: string
    camelCase?: boolean
  },
) {
  const target = toRaw(this_)
  const columns = target.getColumnsCached() as { [key: string]: IColumnInner }
  const modelOptions: IDataModel = (target.constructor as any)[__MODEL__] || {}
  modelOptions.methods = modelOptions.methods || {}
  for (const key in columns) {
    if (columns.hasOwnProperty(key)) {
      if (columns[key].childType) {
        if (target[key] && Array.isArray(target[key])) {
          target[key].forEach((m: any) => {
            callMethod(m, param)
          })
        } else {
          callMethod(target[key], param)
        }
      }
    }
  }

  if ((this_ as any)[param.method]) {
    ;(this_ as any)[param.method]({ data: this_ })
  }
  if (modelOptions?.methods[param.method] && typeof modelOptions?.methods[param.method] === 'string') {
    try {
      const str = modelOptions.methods[param.method]
      const reg = /^\{\{(.*)\}\}$/
      const res = str.match(reg)
      if (res.length > 1) {
        return new Function('$model', 'with($model) { return ('.concat(res[1], '); }'))(this_)
      }
    } catch (err) {
      // console.log(err)
    }
  }
  if (modelOptions.methods[param.method]) {
    modelOptions.methods[param.method]({ data: this_ })
  }
}

function setColumnToTarget(columns: { [key: string]: IColumnInner }, target: ModelBase, curProto: any) {
  const metadata = (target.constructor as any)[Symbol.metadata] || {}
  const columns_ = metadata[__COLUMNS__] || {}
  if (columns_) {
    columns = merge(columns, columns_, { clone: true })
  }
  return columns
}

function getColumnsUtil(columns: { [key: string]: IColumnInner }, target: ModelBase): { [key: string]: IColumnInner } {
  const curProto = Object.getPrototypeOf(target)
  if (Object.getPrototypeOf(curProto)?.getColumns) {
    columns = merge(columns, getColumnsUtil(columns, curProto) || {}, {
      clone: true,
    })
    return setColumnToTarget(columns, target, curProto)
  }
  return setColumnToTarget(columns, target, curProto)
}

export class ModelBase {
  // 做标记用，判断当前class是不是继承ModelBase
  public static isModelBase = true
  constructor(dto?: any, options?: IModelOptions, ...rest: any) {
    const t_ = toRaw(this)
    initModelOptions(t_, options)
    if (!options?.__isInit) {
      createModelByDTO<typeof this>(t_, (t_ as ModelBase).getColumnsCached(), dto, options)
    }
  }

  /**
   * @description 创建一个模型，这个模型是基于当前模型的数据创建的，不会触发 deserialize 方法，不会设置默认值。
   * @param this
   * @param model
   * @param options
   * @returns
   */
  public createModel<T extends ModelBase>(
    this: new (dto: any, options?: IModelOptions) => T,
    model: ModelType<typeof this>,
    options?: IModelOptions,
  ) {
    const t_ = toRaw(this)
    const options_ = options || {}
    options_.__isInit = true
    options_.__noDeserialize = true
    options_.noDefault = true
    const t__ = new t_(model, options_)
    createModelByDTO<T>(t__, (t__ as ModelBase).getColumnsCached(), model, options_)
    return t__ as T
  }

  // 为了支持deno，无法在构造函数中赋值，所以需要提供一个静态方法来创建模型，或者通过新版ModelBase的装饰器去实现，是支持new ModelBase()的。
  // createModel 是 create 的别名，区别是dto数据是否有严格的类型校验。
  public static create<T extends ModelBase>(
    this: new (dto: any, options?: IModelOptions, ...res: any) => T,
    dto?: any,
    options?: IModelOptions,
    ...rest: any
  ) {
    const t_ = toRaw(this)
    const options_ = options || {}
    options_.__isInit = true
    const t__ = new t_(dto, options_, rest)
    createModelByDTO<T>(t__, (t__ as ModelBase).getColumnsCached(), dto, options_)
    return t__
  }

  /**
   * @description 还原数据到上一个保存点之前，初始化保存点为创建对象的时候。
   */
  public static revertChangedData(target: ModelBase | ModelBase[] | { [key: string]: ModelBase }) {
    if (target instanceof Array) {
      target.forEach((item) => {
        ModelBase.revertChangedDataObject(item)
      })
    } else if (((target as any).constructor as typeof ModelBase).isModelBase) {
      ModelBase.revertChangedDataObject(target as ModelBase)
    } else {
      Object.keys(target).forEach((key) => {
        ModelBase.revertChangedDataObject(target[key])
      })
    }
    return this
  }

  public static resetDefault(target: ModelBase | ModelBase[] | { [key: string]: ModelBase }) {
    target = toRaw(target)
    if (target instanceof Array) {
      target.forEach((item) => {
        ModelBase.resetDefaultObject(item)
      })
    } else if (((target as any).constructor as typeof ModelBase).isModelBase) {
      ModelBase.resetDefaultObject(target as ModelBase)
    } else {
      Object.keys(target).forEach((key) => {
        ModelBase.resetDefaultObject((target as any)[key])
      })
    }
    return this
  }

  public static resetDefaultObject<T extends ModelBase>(target: T, options?: IModelOptions) {
    const target_ = toRaw(target)
    createModelByDTO<T>(target_, (target_ as ModelBase).getColumnsCached(), {}, options)
    return target_
  }

  public static revertChangedDataObject(target: ModelBase) {
    const orgTarget = target as any
    target = toRaw(target)
    const C = Object.getPrototypeOf(target).constructor as typeof ModelBase
    const org = C.create(target.getOriginalData(), { noDefault: true })
    // const org = cloneDeep(target.getOriginalData())
    const columns = (target as ModelBase).getColumns()
    // const t = target as any
    for (const key in columns) {
      orgTarget[key] = org[key]
      // t[key] = org[key] 此处不需要更新代理对象原始对象的值，因为代理对象会帮你做这个事情。
      // 也不要手动处理原始对象的值，否则代理对象不会更新。
    }
    return this
  }

  public static callMethod(
    data: ModelBase | ModelBase[],
    params: {
      method: string
      camelCase?: boolean
    },
  ) {
    data = toRaw(data)
    if (Array.isArray(data)) {
      data.forEach((d) => {
        if (((d as any).constructor as typeof ModelBase).isModelBase) {
          d.callMethod(params)
        }
      })
    } else {
      if (((data as any).constructor as typeof ModelBase).isModelBase) {
        data.callMethod(params)
      }
    }
  }

  public callMethod(params: { method: string; camelCase?: boolean }) {
    callMethod(toRaw(this), params)
  }

  /**
   * @description 更新当前对象的值，如果值是对象，递归进行更新，而不改变原始对象的引用。
   * @param dto
   */
  public update(dto: any) {
    const t_ = toRaw(this)
    updateModelByDTO<typeof this>(t_, (t_ as ModelBase).getColumns({ dto }), dto)
    return this
  }

  public setDataByOriginal(dto: any, options?: IDataByOriginalOption) {
    type T = typeof this
    const t_ = toRaw(this)
    if (options?.keepBackUp) {
      extendModelByDTO<T>(t_, (t_ as ModelBase).getColumns({ dto }), dto)
    } else {
      createModelByDTO<T>(t_, (t_ as ModelBase).getColumns({ dto }), dto)
    }
    return this
  }

  /**
   * @description 整个对象是否相等，需要子类自己实现。
   * ignoreEmptyString undefined 与 '' 比较视为相等
   */
  public equal() {
    return true
  }

  /**
   * @description 待完善
   * @description 判断所有 column 对应的值是相等的。
   * ignoreEmptyString undefined 与 '' 比较视为相等
   */
  public isModelEqual(targetData: ModelBase, params?: { ignoreEmptyString?: boolean }) {
    targetData = toRaw(targetData)
    const t_ = toRaw(this)
    const sns = getModelProps(t_, 'serializeNamingStrategies')
    const columns = (t_ as ModelBase).getColumns()
    const target = t_ as ModelBase
    let flag = true
    Object.keys(columns).forEach((columnName) => {
      let orgColumn = columns[columnName].name
      if (sns === NAMING_STRATEGIES.camelCase) {
        orgColumn = columns[columnName].camelCaseName
      }
      const targetValue = (targetData as any)[orgColumn]
      const currentValue = (target as any)[orgColumn]
      if (!flag) {
        // 如果发现不相等的值，则停止
        return
      }
      if (typeof targetValue === 'undefined' && typeof currentValue !== 'undefined') {
        flag = !!(params?.ignoreEmptyString && typeof currentValue === 'string' && currentValue === '')
      } else if (typeof currentValue === 'undefined' && typeof targetValue !== 'undefined') {
        flag = !!(params?.ignoreEmptyString && typeof targetValue === 'string' && targetValue === '')
      } else {
        if (JSON.stringify(targetValue) !== JSON.stringify(currentValue)) {
          flag = false
        }
      }
    })
    return flag
  }

  /**
   * @description 待完善
   * @description 判断所有 column 对应的值是相等的。
   * ignoreEmptyString undefined 与 '' 比较视为相等
   */
  public isContainsModel(targetData: ModelBase, params?: { ignoreEmptyString?: boolean }) {
    targetData = toRaw(targetData)
    const t_ = toRaw(this)
    const sns = getModelProps(t_, 'serializeNamingStrategies')
    const columns = (t_ as ModelBase).getColumns()
    const target = t_ as ModelBase
    let flag = true
    Object.keys(columns).forEach((columnName) => {
      let orgColumn = columns[columnName].name
      if (sns === NAMING_STRATEGIES.camelCase) {
        orgColumn = columns[columnName].camelCaseName
      }
      const targetValue = (targetData as any)[orgColumn]
      const currentValue = (target as any)[orgColumn]
      if (!flag) {
        // 如果发现不相等的值，则停止
        return
      }
      if (typeof targetValue === 'undefined') {
        // 目标值为空，不比较
        flag = true
      } else if (typeof currentValue === 'undefined' && typeof targetValue !== 'undefined') {
        flag = !!(params?.ignoreEmptyString && typeof targetValue === 'string' && targetValue === '')
      } else {
        if (JSON.stringify(targetValue) !== JSON.stringify(currentValue)) {
          flag = false
        }
      }
    })
    return flag
  }

  /**
   * @description 还原数据到上一个保存点之前，初始化保存点为创建对象的时候。
   */
  public revertChangedData() {
    ModelBase.revertChangedData(this)
    return this
  }

  /**
   * @description 当前对象相对于保存点是否有变化。
   * ignoreEmptyString undefined 变为 '' 视为没有变化
   */
  public isChanged(params?: { group?: string; excludeGroup?: string; trim?: boolean; ignoreEmptyString?: boolean }) {
    const t_ = toRaw(this)
    return Object.keys(t_.getChangedData(params)).length !== 0
  }

  /**
   * @description 变更保存点，将当前的数据作为最新的保存点。
   */
  public saveChangedData(param?: { group?: string; excludeGroup?: string; enableDataState?: boolean }) {
    const t_ = toRaw(this)
    const enableDs = getModelProps(t_, 'enableDataState', param)
    if (enableDs) {
      const dto_ = modelToSerializableObj(t_, {
        group: param?.group,
        excludeGroup: param?.excludeGroup,
        clean: CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL,
      })
      const clone = (t_.constructor as any)[__CLONE__] || new WeakMap()
      clone.set(t_, cloneDeep(dto_))
      ;(t_.constructor as any)[__CLONE__] = clone
    }
    return this
  }

  /**
   * @description 获得对象被更改前的原始数据。
   */
  public getOriginalData() {
    const t_ = toRaw(this)
    return (t_.constructor as any)[__CLONE__]?.get(t_) || {}
  }

  /**
   * @description 获得可被序列化的 object 对象，这个对象去除了 空字符 空对象 空数组。
   */
  public getCleanSerializableObject(params?: {
    group?: string
    excludeGroup?: string
    camelCase?: boolean
    trim?: boolean
  }) {
    const t_ = toRaw(this)
    return modelToSerializableObj(t_, {
      clean: CLEAN_ENUM.CLEAN_DIRTY,
      group: params && params.group,
      excludeGroup: params?.excludeGroup,
      camelCase: params && params.camelCase,
      trim: params && params.trim,
    })
  }

  /**
   * @description 获得可被序列化的 object 对象，这个对象没有去除了 空字符 空对象 空数组。
   * @param params
   * clean 默认 CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL 兼容老的数据
   */
  public getSerializableObject(params?: {
    trim?: boolean
    group?: string
    excludeGroup?: string
    clean?: CLEAN_ENUM
    camelCase?: boolean
    enableEmptyValue?: boolean
  }) {
    const t_ = toRaw(this)
    return modelToSerializableObj(t_, {
      clean: params?.clean ?? CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL,
      group: params?.group,
      excludeGroup: params?.excludeGroup,
      camelCase: params?.camelCase,
      trim: params && params.trim,
      enableEmptyValue: params?.enableEmptyValue,
    })
  }

  /**
   *
   * @description 获得可被序列化的 string 字符串，这个字符串去除了 空字符 空对象 空数组。
   */
  public getCleanSerializableString(param?: {
    group?: string
    excludeGroup?: string
    trim?: boolean
    camelCase?: boolean
  }) {
    const t_ = toRaw(this)
    return JSON.stringify(t_.getCleanSerializableObject(param))
  }

  /**
   * @description 获得可被序列化的 string 字符串，这个没有字符串去除了 空字符 空对象 空数组。
   */
  public getSerializableString(param?: { group?: string; excludeGroup?: string; trim?: boolean; camelCase?: boolean }) {
    const t_ = toRaw(this)
    return JSON.stringify(t_.getSerializableObject(param))
  }

  /**
   * @description 获取在上一个保存点之后的变更数据，这个数据只会包含变化的 column 的键值对。
   * @param params
   * clean 默认 CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL 兼容老的数据
   */
  public getChangedData(params?: {
    group?: string
    excludeGroup?: string
    trim?: boolean
    clean?: CLEAN_ENUM
    descriptor?: boolean
    ignoreEmptyString?: boolean
    enableEmptyValue?: boolean
  }) {
    const t_ = toRaw(this)

    const columns = (t_ as ModelBase).getColumns()
    const target = t_ as ModelBase
    const targetData = t_.getSerializableObject({ ...params, enableEmptyValue: false })
    return getChange(columns, target, targetData, {
      ...params,
      clean: params?.clean ?? CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL,
    })
  }

  /**
   * @descriptor 获得变化数据的描述。
   */
  public getChangedDescriptor(params?: {
    group?: string
    excludeGroup?: string
    trim?: boolean
    clean?: CLEAN_ENUM
    ignoreEmptyString?: boolean
  }) {
    const t_ = toRaw(this) as any
    const columns = (t_ as ModelBase).getColumns()
    const target = t_ as ModelBase
    const targetData = t_.getSerializableObject(params)
    return getChange(columns, target, targetData, {
      ...params,
      descriptor: true,
      ignoreEmptyString: params?.ignoreEmptyString,
      clean: params?.clean ?? CLEAN_ENUM.CLEAN_UNDEFINED_AND_NULL,
    })
  }

  /**
   * @deprecated 请使用extendModel
   * @description 当前模型的key存在，就会覆盖，仅支持第一级level的覆盖。如果key是对象，或者数组，覆盖暂时不支持，建议用extendModel。
   * @param model
   */
  public extend(model: any) {
    model = toRaw(model)
    const data: { [index: string]: any } = cloneDeep(model)
    const t_ = toRaw(this)
    const props = (t_ as ModelBase).getColumns()
    for (const key in props) {
      if (data.hasOwnProperty(key)) {
        // 此处应该用this，不能用toRaw后的对象，会引起vue对象丢失响应的问题。
        ;(this as any)[key] = data[key]
      }
    }
    return this
  }

  /**
   *
   * @deprecated 请使用mergeModel
   * @description 当前模型的key对应的值存在，就会覆盖。
   * @param model
   * @param options 待拓展
   */
  public extendModel(model: ModelBase, options?: any) {
    model = toRaw(model)
    const newModel = deepCopy(model)
    const t_ = toRaw(this)
    const props = (t_ as ModelBase).getColumns()
    for (const key in props) {
      if (typeof (newModel as any)[key] !== 'undefined') {
        // 此处应该用this，不能用toRaw后的对象，会引起vue对象丢失响应的问题。
        ;(this as any)[key] = (newModel as any)[key]
      }
    }
    return this
  }

  /**
   *
   * @description 当前模型的key对应的值存在，就会覆盖。
   * @param model
   * @param options 待拓展
   */
  public mergeModel(model: ModelType<typeof this>) {
    model = toRaw(model)
    const newModel = cloneDeep(model)
    const t_ = toRaw(this)
    const props = (t_ as ModelBase).getColumns()
    for (const key in props) {
      if (typeof (newModel as any)[key] !== 'undefined') {
        // 此处应该用this，不能用toRaw后的对象，会引起vue对象丢失响应的问题。
        if ((t_ as any)[key]?.getOriginalData && t_.constructor === newModel.constructor) {
          let origin = null
          if ((t_ as any)[key]?.getOriginalData) {
            origin = (t_ as any)[key].getOriginalData()
          }
          ;(this as any)[key] = (newModel as any)[key]
          if (origin !== null) {
            ;(t_[key].constructor as any)[__CLONE__].set(t_[key], origin)
          }
        } else {
          ;(this as any)[key] = (newModel as any)[key]
        }
      }
    }
    return this
  }

  /**
   * @description 获得 model 的主键集合。
   */
  public getPrimaryKey() {
    const t_ = toRaw(this)
    const primary: { primaryKey: string; primaryColumn: IColumnInner }[] = []
    const columns = (t_ as ModelBase).getColumns()
    for (const columnName in columns) {
      if (columns.hasOwnProperty(columnName)) {
        const column = columns[columnName]
        if (column.primary) {
          primary.push({
            primaryKey: columnName,
            primaryColumn: column,
          })
        }
      }
    }
    if (primary.length === 0) {
      // console.log(this.constructor.name + '没有设置 primary key');
    }
    return primary
  }

  /**
   * @description 在当前对象中获得主键对应的值集合。
   */
  public getPrimaryValue() {
    const t_ = toRaw(this)
    const target = t_ as any
    const valList: any[] = []
    this.getPrimaryKey().forEach((item: any) => {
      valList.push(target[item.primaryKey])
    })
    return valList
  }

  /**
   * @description 从传入对象中获得主键对应的值集合。
   * @param model
   */
  public getPrimaryValueFromData(model: any) {
    const t_ = toRaw(this)
    const sns = getModelProps(t_, 'serializeNamingStrategies')
    const valList: any[] = []
    this.getPrimaryKey().forEach((item) => {
      let column = item.primaryColumn.name
      if (sns === NAMING_STRATEGIES.camelCase) {
        column = item.primaryColumn.camelCaseName
      }
      valList.push(model[column])
    })
    return valList
  }

  public getColumnsCached(data?: { dto?: any }) {
    const t_ = toRaw(this)
    const columnsCached = t_.constructor[Symbol.metadata]?.[__COLUMNS_CACHED__]
    if (columnsCached) {
      return columnsCached
    } else {
      const columns = this.getColumns(data)
      const metadata = t_.constructor[Symbol.metadata] || {}
      metadata[__COLUMNS_CACHED__] = columns
      if (t_.constructor[Symbol.metadata]) {
        Object.assign((t_.constructor as any)[Symbol.metadata], metadata)
      } else {
        t_.constructor[Symbol.metadata] = metadata
      }
      ;(t_.constructor as any)[__COLUMNS_CACHED__] = columns
      return columns
    }
  }

  public getColumns(data?: { dto?: any }): { [key: string]: IColumnInner } {
    const t_ = toRaw(this)
    let columns_ = {} as { [key: string]: IColumnInner }
    const isColInVal = getModelProps(t_, 'columnsInValue')
    if (isColInVal) {
      if (data?.dto) {
        columns_ = generateColumnsFromData(t_, data?.dto)
      } else {
        columns_ = generateColumnsFromData(t_, t_)
      }
    }

    // let keys = Object.keys(t_)
    // const columns_ = {} as { [key: string]: IColumnInner }
    const columns__ = t_.constructor[Symbol.metadata]?.[__COLUMNS__]
    if (!columns__) {
      return {}
    }
    if (columns__) {
      return merge(columns_, columns__, {
        clone: true,
      })
    }
    let columns = {} as { [key: string]: IColumnInner }
    columns = merge(columns_, getColumnsUtil(columns, Object.getPrototypeOf(t_)) || {}, {
      clone: true,
    })
    return columns
  }

  public setColumnData(key: string, value: any) {
    const target = this as any
    target[key] = value
    return this
  }

  public getColumnData(key: string) {
    const target = this as any
    return target[key]
  }
}
