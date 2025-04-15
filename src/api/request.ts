import Taro from "@tarojs/taro"
import HttpResult from './http-result'
import jz from '../jz'

class RequestManager {
  private static cache: { [key: string]: Promise<any> } = {};
  
  private static getStoredToken() {
    const tokenData = Taro.getStorageSync('access_token_data')
    if (!tokenData) return null
    
    const { token, expireTime } = JSON.parse(tokenData)
    if (Date.now() > expireTime) {
      Taro.removeStorageSync('access_token_data')
      return null
    }
    return token
  }

  private static setStoredToken(token: string) {
    const expireTime = Date.now() + 2 * 60 * 60 * 1000 // 2小时过期
    Taro.setStorageSync('access_token_data', JSON.stringify({
      token,
      expireTime
    }))
  }

  static async get(url, endpoint, code): Promise<any> {
    // 先检查本地存储的 token
    const storedToken = this.getStoredToken()
    if (storedToken) {
      return {
        statusCode: 200,
        data: { session: storedToken }
      }
    }

    // 如果没有有效的缓存 token，则发起请求
    if (this.cache[url]) {
      return this.cache[url];
    }

    const checkOpenId = Taro.request({
      method: 'POST',
      url: `${endpoint}/check_openid`,
      header: {
        'X-WX-Code': code,
        'X-WX-APP-ID': jz.appId,
      }
    }).then(res => {
      if (res.statusCode === 200 && res.data.session) {
        this.setStoredToken(res.data.session)
      }
      return res
    })

    this.cache[url] = checkOpenId
    return this.cache[url];
  }

  static async delCache() {
    this.cache = {}
    Taro.removeStorageSync('access_token_data')
  }
}

class Request {
  public _endpoint: string
  constructor (endpoint: string) {
    this._endpoint = endpoint  
  }

  get (path, data?, options = {}) {
    return this.request('GET', path, data, options)
  }

  post (path, data, options = {}): Promise<HttpResult> {
    return this.request('POST', path, data, options)
  }

  put (path, data, options = {}): Promise<HttpResult> {
    return this.request('PUT', path, data, options)
  }

  delete (path, data={}, options = {}): Promise<HttpResult> {
    return this.request('DELETE', path, data, options)
  }

  async upload (file_path, formData) {
    const accessToken = await this.getAccessToken()
    const header = {
      'content-type': 'application/json',
      'X-WX-APP-ID': jz.appId,
      'X-WX-Skey': accessToken,
    }

    return Taro.uploadFile({
      url: `${this._endpoint}/upload`,
      header: header,
      filePath: file_path,
      formData: formData,
      name: 'file'
    })
  }

  async getAccessToken(): Promise<string> {
    const loginCode = await Taro.login()
    const res = await RequestManager.get('check_openid', this._endpoint, loginCode.code)
    if (res.statusCode === 200) {
      return res.data.session
    }
    RequestManager.delCache()
    return ''
  }

  async request (method, path, data, options = {}): Promise<HttpResult> {
    let retryCount = 5
    let lastResult: HttpResult | null = null
    // 处理路径，确保endpoint和path之间只有一个/
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path
    const requestUrl = `${this._endpoint}/${normalizedPath}`
    const header = Object.assign({
      'content-type': 'application/json',
      'X-WX-APP-ID': jz.appId
    }, options['header'])

    while (retryCount >= 0) {
      const accessToken = await this.getAccessToken()
      header['X-WX-Skey'] = accessToken
      try {
        const res = await Taro.request({
          method: method,
          url: requestUrl,
          data: data,
          header: header,
        })

        const result = new HttpResult(res);
        if (result['data'] && result['data']['status'] === 301) {
          RequestManager.delCache()
          retryCount--
          continue
        } else {
          lastResult = result
          break
        }
      } catch (error) {
        RequestManager.delCache()
        retryCount--
        if (retryCount < 0) {
          throw error
        }
      }
    }

    return lastResult
  }
}

export default Request