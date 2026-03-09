/**
 * 生成符合 RFC4122 v4 标准的 UUID
 *
 * 结合时间戳和随机数生成唯一标识符，支持高精度计时器以提高唯一性。
 *
 * @returns 格式为 xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx 的 UUID 字符串
 *
 * @example
 * const id = generateUUID() // '550e8400-e29b-41d4-a716-446655440000'
 */
export function generateUUID() {
  let d = new Date().getTime()

  // 使用高精度计时器增加熵值（如果可用）
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    // y 位置的值必须是 8, 9, a, 或 b（RFC4122 规范）
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
