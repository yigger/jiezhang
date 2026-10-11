// 从本地配置文件导入
import devConfig from './config'

type Config = {
  appid: string
  host: string
  api_url: string
  web_host: string
  web_auth_mode: 'development' | 'session'
}

const host = process.env.NODE_ENV === 'development' ? devConfig.dev_host : devConfig.production_host

const config: Config = {
  appid: devConfig.appid,
  host: host,
  api_url: process.env.TARO_ENV === 'h5' ? process.env.JZ_WEB_API_BASE || '/api' : `${host}/api`,
  web_host: devConfig.web_host,
  web_auth_mode:
    process.env.NODE_ENV === 'development' && process.env.JZ_WEB_AUTH_MODE !== 'session'
      ? 'development'
      : 'session'
}

export default config
