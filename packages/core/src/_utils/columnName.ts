/**
 * 命名风格转换工具函数
 *
 * 提供驼峰命名（camelCase）与蛇形命名（snake_case）之间的相互转换，
 * 用于处理前后端数据交互时的属性名转换。
 */

/**
 * 将驼峰命名转换为蛇形命名
 *
 * @param str - 驼峰命名的字符串
 * @returns 蛇形命名的字符串
 *
 * @example
 * camelToSnake('userName') // 'user_name'
 * camelToSnake('getUserById') // 'get_user_by_id'
 */
export function camelToSnake(str: string) {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

/**
 * 将蛇形命名转换为驼峰命名
 *
 * @param str - 蛇形命名的字符串
 * @returns 驼峰命名的字符串
 *
 * @example
 * snakeToCamel('user_name') // 'userName'
 * snakeToCamel('get_user_by_id') // 'getUserById'
 */
export function snakeToCamel(str: string) {
  return str.replace(/(_\w)/g, (match) => match[1].toUpperCase())
}
