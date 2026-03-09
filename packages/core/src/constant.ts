/**
 * Model Base 核心常量定义
 *
 * 这些常量用于在 Model 对象上存储元数据的键名，
 * 通过 Symbol.metadata 或直接属性访问这些数据。
 */

/** 用于存储模型实例原始数据快照的 WeakMap 键名，支持变更追踪和还原功能 */
export const __CLONE__ = '__CLONE__'

/** 用于存储 @DataModel 装饰器配置信息的键名 */
export const __MODEL__ = '__MODEL__'

/** 用于存储 @Column 装饰器定义的列元数据的键名 */
export const __COLUMNS__ = '__COLUMNS__'

/** 用于存储已缓存的列元数据的键名，避免重复计算 */
export const __COLUMNS_CACHED__ = '__COLUMNS_CACHED__'

/** 用于存储模型实例级别配置选项的键名 */
export const __MODEL_PROPS__ = '__MODEL_PROPS__'

/**
 * 命名策略枚举
 *
 * 用于控制序列化/反序列化时属性名的转换规则：
 * - camelCase: 使用驼峰命名（如 userName）
 * - snakeCase: 使用下划线命名（如 user_name）
 * - mix: 混合模式，反序列化时同时支持两种命名
 */
export const NAMING_STRATEGIES = {
  camelCase: 'camelCase',
  snakeCase: 'snakeCase',
  mix: 'mix',
} as const
