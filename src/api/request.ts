import Taro from '@tarojs/taro'
import jz from '../jz'
import HttpResult, { ApiError, isRecord } from './http-result'

interface StoredToken {
  token: string
  expireTime: number
  scope: string
}
interface RequestOptions {
  header?: Record<string, string>
}
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'
type RequestData = object | string | undefined

export class RequestManager {
  private static pending = new Map<string, Promise<string>>()

  static clear() {
    Taro.removeStorageSync('access_token_data')
  }

  static get(endpoint: string, appid: string): Promise<string> {
    const scope = `${endpoint}|${appid}`
    try {
      const raw: unknown = Taro.getStorageSync('access_token_data')
      const stored: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (
        isRecord(stored) &&
        stored.scope === scope &&
        typeof stored.token === 'string' &&
        stored.token &&
        typeof stored.expireTime === 'number' &&
        stored.expireTime > Date.now()
      ) {
        return Promise.resolve(stored.token)
      }
    } catch {
      /* Invalid local cache must not prevent a fresh login. */
    }
    const pending = this.pending.get(scope)
    if (pending) return pending
    const request = (async () => {
      const { code } = await Taro.login()
      if (!code) throw new Error('无法获取登录凭证')
      const response = await Taro.request<unknown>({
        method: 'POST',
        url: `${endpoint}/check_openid`,
        header: { 'X-WX-Code': code, 'X-WX-APP-ID': appid }
      })
      const result = new HttpResult(response)
      if (
        !result.isSuccess ||
        !isRecord(result.data) ||
        typeof result.data.session !== 'string' ||
        !result.data.session
      ) {
        throw new ApiError(result)
      }
      const stored: StoredToken = {
        token: result.data.session,
        expireTime: Date.now() + 2 * 60 * 60 * 1000,
        scope
      }
      Taro.setStorageSync('access_token_data', JSON.stringify(stored))
      return stored.token
    })().finally(() => this.pending.delete(scope))
    this.pending.set(scope, request)
    return request
  }
}

export default class Request {
  readonly _endpoint: string
  constructor(endpoint: string) {
    this._endpoint = endpoint.replace(/\/+$/, '')
  }
  get<T = unknown>(path: string, data?: RequestData, options: RequestOptions = {}) {
    return this.request<T>('GET', path, data, options)
  }
  post<T = unknown>(path: string, data?: RequestData, options: RequestOptions = {}) {
    return this.request<T>('POST', path, data, options)
  }
  put<T = unknown>(path: string, data?: RequestData, options: RequestOptions = {}) {
    return this.request<T>('PUT', path, data, options)
  }
  delete<T = unknown>(path: string, data: RequestData = {}, options: RequestOptions = {}) {
    return this.request<T>('DELETE', path, data, options)
  }
  getAccessToken(): Promise<string> {
    return RequestManager.get(this._endpoint, jz.appId)
  }

  async upload(filePath: string, formData: Record<string, string | number>) {
    const accessToken = await this.getAccessToken()
    const response = await Taro.uploadFile({
      url: `${this._endpoint}/upload`,
      filePath,
      formData,
      name: 'file',
      header: { 'X-WX-APP-ID': jz.appId, 'X-WX-Skey': accessToken }
    })
    const data: unknown = JSON.parse(response.data)
    const result = new HttpResult({ ...response, data })
    if (!result.isSuccess) throw new ApiError(result)
    return response
  }

  async request<T>(
    method: Method,
    path: string,
    data?: RequestData,
    options: RequestOptions = {}
  ): Promise<HttpResult<T>> {
    // Only an explicit authentication rejection can be replayed. A lost response
    // to a write does not mean the write was rolled back on the server.
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await this.getAccessToken()
      const response = await Taro.request<T>({
        method,
        url: `${this._endpoint}/${path.replace(/^\/+/, '')}`,
        data,
        header: {
          'content-type': 'application/json',
          ...options.header,
          'X-WX-APP-ID': jz.appId,
          'X-WX-Skey': token
        }
      })
      const result = new HttpResult(response)
      if (isRecord(result.data) && result.data.status === 301) {
        RequestManager.clear()
        if (attempt === 0) continue
      }
      if (!result.isSuccess) throw new ApiError(result)
      return result
    }
    throw new Error('登录已失效，请重试')
  }
}
