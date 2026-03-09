/**
 * 对象路径操作工具
 *
 * 提供通过点分隔路径字符串访问和修改嵌套对象属性的功能。
 * 支持数组索引语法（如 'items[0].name'）。
 */

/**
 * 通过路径获取属性信息
 *
 * 解析路径并返回目标对象、键名和值。
 * 支持数组索引语法，会自动转换为点语法处理。
 *
 * @param obj - 源对象
 * @param path - 属性路径（如 'user.profile.name' 或 'items[0].value'）
 * @param strict - 严格模式，路径不存在时抛出错误
 * @returns 包含目标对象、键名和值的对象
 *
 * @example
 * const data = { user: { profile: { name: 'John' } } }
 * const result = getPropByPath(data, 'user.profile.name', false)
 * // { o: { name: 'John' }, k: 'name', v: 'John' }
 */
export function getPropByPath(obj: any, path: string, strict: boolean) {
  let tempObj = obj
  // 将数组索引语法转换为点语法
  path = path.replace(/\[(\w+)\]/g, '.$1')
  path = path.replace(/^\./, '')

  const keyArr = path.split('.')
  let i = 0
  for (const len = keyArr.length; i < len - 1; ++i) {
    if (!tempObj && !strict) {
      break
    }
    const key = keyArr[i]
    if (key in tempObj) {
      tempObj = tempObj[key]
    } else {
      if (strict) {
        throw new Error('please transfer a valid prop path to form item!')
      }
      break
    }
  }
  return {
    o: tempObj,
    k: keyArr[i],
    v: tempObj ? tempObj[keyArr[i]] : null,
  }
}

/**
 * 通过路径获取值
 *
 * @param object - 源对象
 * @param prop - 属性路径
 * @returns 路径对应的值，不存在则返回 null
 *
 * @example
 * const data = { user: { name: 'John' } }
 * getValueByPath(data, 'user.name') // 'John'
 * getValueByPath(data, 'user.age') // null
 */
export function getValueByPath(object: any, prop: string) {
  prop = prop || ''
  const paths = prop.split('.')
  let current = object
  let result = null

  for (let i = 0, j = paths.length; i < j; i++) {
    const path = paths[i]
    if (!current) {
      break
    }

    if (i === j - 1) {
      result = current[path]
      break
    }
    current = current[path]
  }
  return result
}

/**
 * 通过路径设置值
 *
 * @param object - 源对象
 * @param prop - 属性路径
 * @param value - 要设置的值
 *
 * @example
 * const data = { user: { name: 'John' } }
 * setValueByPath(data, 'user.name', 'Jane')
 * // data.user.name === 'Jane'
 */
export function setValueByPath(object: any, prop: string, value: any) {
  prop = prop || ''
  const paths = prop.split('.')
  let current = object

  for (let i = 0, j = paths.length; i < j; i++) {
    const path = paths[i]
    if (!current) {
      break
    }

    if (i === j - 1) {
      current[path] = value
      break
    }
    current = current[path]
  }
}
