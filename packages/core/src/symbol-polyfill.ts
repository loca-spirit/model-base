/**
 * Symbol.metadata Polyfill
 *
 * 为不支持 ES Decorators Metadata 的环境提供 Symbol.metadata 兼容支持。
 * TC39 Stage 3 提案要求装饰器可以通过 Symbol.metadata 访问类的元数据对象。
 *
 * @see https://github.com/tc39/proposal-decorator-metadata
 */
export {}

declare global {
  interface SymbolConstructor {
    readonly metadata: unique symbol
  }
}

// 如果 Symbol.metadata 不存在，则创建一个全局唯一的 Symbol
;(Symbol as any).metadata ??= Symbol.for('Symbol.metadata')

// 创建一个空的元数据存储对象
const _metadata = Object.create(null)

// 将元数据对象挂载到 globalThis 上，供装饰器访问
if (typeof Symbol === 'function' && Symbol.metadata) {
  Object.defineProperty(globalThis, Symbol.metadata, {
    enumerable: true,
    configurable: true,
    writable: true,
    value: _metadata,
  })
}
