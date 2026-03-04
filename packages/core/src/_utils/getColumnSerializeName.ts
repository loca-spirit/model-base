/**
 * 列序列化名称获取工具
 */

import { NAMING_STRATEGIES } from '../constant'
import { IColumnInner } from '../decorator'

/**
 * 根据命名策略获取列的序列化名称
 *
 * @param field - 列的内部配置对象
 * @param sns - 序列化命名策略（serializeNamingStrategies）
 * @returns 根据策略返回驼峰或蛇形命名
 *
 * @example
 * // 如果 sns 是 'camelCase'，返回 'userName'
 * // 否则返回 'user_name'
 */
export function getColumnSerializeName(field: IColumnInner, sns?: string): string {
  if (sns === NAMING_STRATEGIES.camelCase) {
    return field.camelCaseName
  }
  return field.name
}
