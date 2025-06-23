import { type ModelSnakeType, type ModelType, ModelBase } from '@model-base/core'
import type { Driver } from './api/Driver'
import { type Wrapper } from './response'

/**
 * options: {
 *   allowEmptyData: 是否允许提交空数据 前提是params为ModelBase类型
 *   headers: {
 *     'Content-Type': 'multipart/form-data',
 *   },
 * },
 * wrapper: 解析返回数据
 */
export type WrapperConstructor<Sub extends Wrapper> = Sub['data']

export type WrapperType<U> = U extends Wrapper
  ? WrapperConstructor<U>
  : U extends typeof ModelBase
  ? InstanceType<U>
  : any

export interface IServiceParam<T, U> {
  params?: ModelBase | any
  options?: any
  beforeParse?: (dto: any) => any
  beforeDeserialize?: (data: { json: any; snakeJson?: ModelSnakeType<T>; modelJson?: ModelType<T> }) => any
  afterParse?: (serviceResponse: T) => T
  afterDeserialize?: (serviceResponse: T) => T
  wrapper?: U
}

export interface IServiceParamRequest<T, U> extends IServiceParam<T, U> {
  type?: 'get' | 'post' | 'del' | 'put' | 'patch'
}

export type ServiceResponseType<R, U> = Omit<R, 'data'> & { data: WrapperType<U> }

export class CoreService<T, R> {
  public driver!: Driver
  public serviceResponseType!: new (...args: any[]) => R

  constructor(adapter: Driver, serviceResponseType: new (...args: any[]) => R) {
    this.driver = adapter
    this.serviceResponseType = serviceResponseType
  }

  public get<U>(url: string, data?: IServiceParam<T, U>) {
    data = data || {}
    return this.request(url, { ...data, type: 'get' }) as any as Promise<ServiceResponseType<R, U>>
  }

  public post<U>(url: string, data?: IServiceParam<T, U>) {
    data = data || {}
    return this.request(url, { ...data, type: 'post' }) as any as Promise<ServiceResponseType<R, U>>
  }

  public del<U>(url: string, data?: IServiceParam<T, U>) {
    data = data || {}
    return this.request(url, { ...data, type: 'del' }) as any as Promise<ServiceResponseType<R, U>>
  }

  public put<U>(url: string, data?: IServiceParam<T, U>) {
    data = data || {}
    return this.request(url, { ...data, type: 'put' }) as any as Promise<ServiceResponseType<R, U>>
  }

  public patch<U>(url: string, data?: IServiceParam<T, U>) {
    data = data || {}
    return this.request(url, { ...data, type: 'patch' }) as any as Promise<ServiceResponseType<R, U>>
  }

  public async request<T, U>(url: string, param_?: IServiceParamRequest<T, U>) {
    const p = param_ || {}
    let apiData: any
    const wrapper = p?.wrapper as Wrapper
    if (wrapper) {
      if ((wrapper as Wrapper).constructor.prototype.constructor.isDataWrapper) {
        p.params = wrapper.processParams?.(p.params)
      }
    }
    try {
      apiData = await this.req(url, {
        type: p?.type || 'get',
        params: p?.params,
        options: p?.options,
      })
      if (p?.beforeParse) {
        apiData = p.beforeParse(apiData)
      }
      if (p?.beforeDeserialize) {
        p.beforeDeserialize({
          json: apiData,
          snakeJson: apiData,
          modelJson: apiData,
        })
      }
      let serviceResponse = (this.serviceResponseType as any).create(apiData, {}, p?.wrapper)
      if (p?.afterParse) {
        serviceResponse = p.afterParse.call(null, serviceResponse as any) as any as R
      }
      if (p?.afterDeserialize) {
        serviceResponse = p.afterDeserialize.call(null, serviceResponse as any) as any as R
      }
      return serviceResponse
    } catch (e: any) {
      if (e.result_code) {
        return (this.serviceResponseType as any).create(e)
      } else {
        const serviceResponse = (this.serviceResponseType as any).create({
          result_code: 'service_error',
        })
        serviceResponse.serviceError = e
        console.error('service_error', e)
        return serviceResponse
      }
    }
  }

  private req(
    url: string,
    data: {
      type: 'get' | 'post' | 'del' | 'put' | 'patch'
      params?: ModelBase | any
      options?: any
    },
  ) {
    let params = data.params
    if (data.params && data.params.getSerializableObject) {
      if (data.options && data.options.allowEmptyData) {
        params = data.params?.getSerializableObject()
      } else {
        params = data.params?.getCleanSerializableObject()
      }
    }
    return this.driver.getApi()[data.type](url, params, data.options)
  }
}
