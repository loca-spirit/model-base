/**
 * 获取响应式对象的原始值
 *
 * 用于从 Vue/其他响应式框架包装的对象中提取原始对象。
 * 支持 Vue 3 的 __v_raw 和自定义的 __target__ 两种标识。
 *
 * @param observed - 可能被响应式包装的对象
 * @returns 原始对象
 *
 * @example
 * const rawUser = toRaw(reactiveUser)
 */
export function toRaw<T = any>(observed: T): T {
  // Vue 3 响应式对象使用 __v_raw 存储原始值
  const raw = observed && (observed as any).__v_raw

  // 递归解包，支持多层嵌套的响应式对象
  // 同时支持自定义的 __target__ 属性（用于其他代理场景）
  return raw ? toRaw(raw) : (observed as any)?.__target__ ? (observed as any).__target__ : (observed as any)
}
