---
permalink: /guide/faq/
---

## 常见问题
### typescript5的问题
::: info typescript5的问题

项目的输出目标必须是es5才可以正确的启用emitDecoratorMetadata

:::
### vite集成modelbase

::: info vite集成modelbase

因为 vite 是强依赖 esbuild 的，而 esbuild 的最大特性就是速度快，所以也不愿意支持完整的 typescript type checker。
导致 vite 不能和 reflect-metadata 一起使用，比较有名的框架包括 typeorm，nestjs 等都不能很好的结合。

方案1：[vite支持decorator](https://www.bilibili.com/opus/532019046365278571)

方案2：
```ts
import typescript from '@rollup/plugin-typescript'

export default defineConfig({
  plugins: [
    // 所有应用到ModelBase的文件都需要被拦截，路径加入到include当中。
    typescript({
        include: ['src/**/*.ts']
      })
  ],
})

```
:::
## undefined问题
### 启用meta配置

::: info 启用配置

因为modelbase利用reflect-metadata，所以我们需要在tsconfig.json里面启用如下配置：
```ts
"compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
}
```
:::
### 路径引用


另外引用modelbase的childType（model）的时候，必须进行直接引用，否则会因为加载顺序问题导致childType（model）无法被读取到。

::: tip 正确的引用方式

```ts
import { DeviceModel } from '@/device/Device.model'
// 或
import { DeviceModel } from './Device.model'

class xx {
  @Column({ childType: DeviceModel, autowired: true })
  @Column({ model: DeviceModel, autowired: true })
}
```
:::
::: caution 错误的方式

```ts
import { DeviceModel } from '@/device'

class xx {
  @Column({ childType: DeviceModel, autowired: true })
  @Column({ model: DeviceModel, autowired: true })
}
```
:::
### 指定model

::: tip 正确写法（推荐）

`Consumer`需要在`ConsumerList`前面，同时指定了model（childType）。
```ts
class Consumer extends ModelBase {
  @Column()
  public userName: string
}

class ConsumerList extends ModelBase {
  @Column({ model: () => Consumer})
  public child: Consumer
}
```
:::
::: warning 正常使用

`Consumer`需要在`ConsumerList`后面了（错误，可以通过eslint去纠正），同时指定了model（childType）。
```ts
class ConsumerList extends ModelBase {
  @Column({ model: Consumer})
  public child: Consumer
}

class Consumer extends ModelBase {
  @Column()
  public userName: string
}
```
:::
::: warning 正常使用

`Consumer`在`ConsumerList`前面了，但是没有指定了model（错误）。
```ts
class Consumer extends ModelBase {
  @Column()
  public userName: string
}

class ConsumerList extends ModelBase {
  @Column()
  public child: Consumer
}
```
:::
::: caution 错误使用

class定义顺序不对，也没有指定model（别名childType），无法正确new出对象。
```ts
class ConsumerList extends ModelBase {
  @Column()
  public child: Consumer
}

class Consumer extends ModelBase {
  @Column()
  public userName: string
}
```
:::
### 关闭define配置
#### 关闭`useDefineForClassFields`
::: info 在tsconfig.json关闭配置

```json
"compilerOptions": {
    "useDefineForClassFields": false,
}
```
:::
#### 问题分析
升级typescript后，`useDefineForClassFields`默认是`true`。

```json
"compilerOptions": {
    "useDefineForClassFields": true,
}
```
如果启用 `useDefineForClassFields`，会使用 `Object.defineProperty` 来初始化声明，对于class的继承会出现值undefined的问题。
下面的例子中
::: note 代码示例
通过`new Consumer(dto)`进行实例化。
```ts
class ModelBase {
  constructor(dto： any) {
    this.userName = dto?.userName;
  }
}

class Consumer extends ModelBase {
  public userName: string
}
```
:::
::: info 编译结果
启用`useDefineForClassFields`后的编译结果。

```ts
"use strict";
class ModelBase {
    constructor(dto, any) {
        this.userName = dto === null || dto === void 0 ? void 0 : dto.userName;
    }
}
class Consumer extends ModelBase {
    constructor() {
        // ModelBase的会在Consumer的`super(...arguments)`函数进行初始化复制
        super(...arguments);
        // 将userName初始化为'undefined'
        Object.defineProperty(this, "userName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
```
:::
