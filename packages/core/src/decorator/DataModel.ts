/**
 * @DataModel 类装饰器
 *
 * 用于配置模型类的全局行为，如自定义方法、命名策略、状态追踪等。
 */

import { __MODEL__ } from '../constant'
import { IDataModel } from './types'

/** 本地数据模型的 Symbol 键 */
export const LOCA_DATA_MODEL_KEY = Symbol.for('locaDataModelKey')

/**
 * 模型类装饰器
 *
 * 为模型类添加元数据配置，影响整个类的序列化/反序列化行为。
 *
 * @param params - 模型配置参数
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @DataModel({
 *   enableDataState: true,
 *   methods: {
 *     onInit: ({ data }) => console.log('Initialized:', data)
 *   }
 * })
 * class User extends ModelBase {
 *   @Column()
 *   name: string
 * }
 * ```
 */
export function DataModel(params?: IDataModel) {
  return <TFunction extends Function>(constructor: TFunction) => {
    const model = {
      methods: params?.methods || {},
      columnsInValue: params?.columnsInValue,
      keepModelName: params?.keepModelName,
      enableDataState: params?.enableDataState,
    } as IDataModel
    ;(constructor as any)[__MODEL__] = model
  }
}
