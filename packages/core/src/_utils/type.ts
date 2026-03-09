/**
 * 类型工具定义
 *
 * 提供运行时类型检查和 TypeScript 类型辅助工具。
 */

/** Function 构造函数的引用，用于类型守卫 */
export const Type = Function

/**
 * 类型守卫：检查值是否为构造函数类型
 *
 * @param v - 待检查的值
 * @returns 如果是构造函数则返回 true
 */
export function isType(v: any): v is Type<any> {
  return typeof v === 'function'
}

/**
 * 表示一个可以通过 new 调用的构造函数类型
 *
 * @typeParam T - 构造函数实例化后的类型
 */
export type Type<T> = new (...args: any[]) => T

/**
 * 将对象的指定键的属性设为可变
 *
 * @typeParam T - 原始对象类型
 * @typeParam K - 要设为可变的键
 */
export type Mutable<T extends { [x: string]: any }, K extends number> = {
  [P in K]: T[P]
}
