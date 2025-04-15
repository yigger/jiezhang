// 从本地配置文件导入
import devConfig from './config'

type Config = {
  appid: string,
  host: string,
  api_url: string,
  web_host: string
}

const host = process.env.NODE_ENV === 'development' ? devConfig.dev_host : devConfig.production_host

const config: Config = {
  appid: devConfig.appid,
  host: host,
  api_url: `${host}/api`,
  web_host: devConfig.web_host,
}

export default config
