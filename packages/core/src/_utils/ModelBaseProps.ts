/**
 * Created by shuai.meng on 2017/8/2.
 */
import { __MODEL__, __MODEL_PROPS__, NAMING_STRATEGIES } from '../constant'
import { IModelOptions, IModelProps } from '../decorator'
import { ModelBase } from '../model/ModelBase'
import { toRaw } from './toRaw'

export class ModelOptions implements IModelOptions {
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
  noDefault?: boolean
  enableDataState?: boolean
  keepModelName?: boolean
  columnsInValue?: boolean
  deserializeNamingStrategies?: 'mix' | 'camelCase' | 'snakeCase'
  serializeNamingStrategies?: 'camelCase' | 'snakeCase'
  group?: string
  excludeGroup?: string
  __isInit?: boolean
  __noDeserialize?: boolean
}
const defaultModelOptions: IModelProps = {
  noDefault: false,
  enableDataState: true,
  keepModelName: false,
  columnsInValue: false,
  deserializeNamingStrategies: NAMING_STRATEGIES.mix,
  serializeNamingStrategies: NAMING_STRATEGIES.snakeCase,
}
/**
 * 因为性能问题，获取模型属性，默认值都在这里兜底而不是在ModelBase中初始化默认值。
 * @param t_ 模型实例
 * @param prop 属性名
 * @param current 当前运行时的Scope的模型属性，不会设置到实例上。
 * @returns 属性值
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

export function initModelOptions<T extends ModelBase>(t_: T, options?: IModelOptions) {
  // 性能考虑，如果options为空，则不初始化__model_props__
  if (typeof options !== 'undefined') {
    Object.defineProperty(t_, __MODEL_PROPS__, {
      value: new ModelOptions(options),
      writable: false,
      configurable: false,
      enumerable: false,
    })
  }
  /**
   * TODO:
   * 针对 __model__ 上面的属性定义分为两种。t_.constructor 和 t_
   * 因为存在动态模型，所以针对 __model__ 的归属只能通过 current 这个参数来区分。
   */
}
