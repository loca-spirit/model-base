/**
 * 模型配置属性管理
 *
 * 提供模型选项的存储、获取和默认值处理。
 * 配置优先级：运行时参数 > 实例级配置 > 类级配置 > 全局默认值
 *
 * @author shuai.meng
 * @since 2017/8/2
 */

import { __MODEL__, __MODEL_PROPS__, NAMING_STRATEGIES } from '../constant'
import { IModelOptions, IModelProps } from '../decorator'
import { ModelBase } from '../model/ModelBase'
import { toRaw } from './toRaw'

/**
 * 模型选项类
 *
 * 封装模型的所有配置选项，支持序列化/反序列化行为定制。
 */
export class ModelOptions implements IModelOptions {
  /** 是否跳过默认值设置 */
  noDefault?: boolean

  /** 是否启用数据状态追踪（变更检测） */
  enableDataState?: boolean

  /** 是否保持原始属性名（不进行命名转换） */
  keepModelName?: boolean

  /** 是否从实例值推断列定义 */
  columnsInValue?: boolean

  /** 反序列化时的命名策略 */
  deserializeNamingStrategies?: 'mix' | 'camelCase' | 'snakeCase'

  /** 序列化时的命名策略 */
  serializeNamingStrategies?: 'camelCase' | 'snakeCase'

  /** 分组标识，用于选择性序列化/反序列化 */
  group?: string

  /** 排除的分组标识 */
  excludeGroup?: string

  /** 内部标识：是否已完成初始化 */
  __isInit?: boolean

  /** 内部标识：是否跳过反序列化处理 */
  __noDeserialize?: boolean

  constructor(options?: IModelOptions) {
    if (options) {
      this.noDefault = options.noDefault
      this.enableDataState = options.enableDataState
      this.keepModelName = options.keepModelName
      this.columnsInValue = options.columnsInValue
      this.deserializeNamingStrategies = options.deserializeNamingStrategies || NAMING_STRATEGIES.mix
      this.serializeNamingStrategies = options.serializeNamingStrategies || NAMING_STRATEGIES.snakeCase
      this.group = options.group
      this.excludeGroup = options.excludeGroup
    }
  }
}

/**
 * 全局默认模型配置
 *
 * 当没有显式配置时使用这些默认值
 */
const defaultModelOptions: IModelProps = {
  noDefault: false,
  enableDataState: true,
  keepModelName: false,
  columnsInValue: false,
  deserializeNamingStrategies: NAMING_STRATEGIES.mix,
  serializeNamingStrategies: NAMING_STRATEGIES.snakeCase,
}

/**
 * 获取模型属性配置值
 *
 * 按以下优先级获取配置：
 * 1. current（运行时传入的临时配置）
 * 2. 实例级配置（__MODEL_PROPS__）
 * 3. 类级配置（@DataModel 装饰器配置的 __MODEL__）
 * 4. 全局默认值
 *
 * 性能优化：默认值在此函数中兜底，避免在 ModelBase 构造函数中初始化。
 *
 * @param t_ - 模型实例
 * @param prop - 属性名
 * @param current - 运行时的临时配置（可选）
 * @returns 配置属性值
 */
export function getModelProps<T extends ModelBase>(t_: T, prop: keyof IModelProps, current?: IModelProps) {
  const t__ = toRaw(t_)
  return (
    current?.[prop] ??
    t__[__MODEL_PROPS__]?.[prop] ??
    (t__.constructor as any)[__MODEL__]?.[prop] ??
    defaultModelOptions[prop]
  )
}

/**
 * 初始化模型实例的配置选项
 *
 * 将配置选项作为不可枚举属性绑定到模型实例上。
 * 性能优化：仅在有配置时才创建属性。
 *
 * @param t_ - 模型实例
 * @param options - 配置选项
 */
export function initModelOptions<T extends ModelBase>(t_: T, options?: IModelOptions) {
  if (typeof options !== 'undefined') {
    Object.defineProperty(t_, __MODEL_PROPS__, {
      value: new ModelOptions(options),
      writable: false,
      configurable: false,
      enumerable: false,
    })
  }
}
