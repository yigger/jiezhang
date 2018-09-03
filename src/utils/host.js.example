// 0 开发环境 1 测试环境 2 生产环境
const env = 0

let host = ''
if (env === 0) {
  host = 'http://jz.com'
} else if (env == 1) {
  host = 'https://xiaoyounger.com'
} else {
  host = 'https://yiiiblog.com'
}

module.exports = {
  host: host,
  url: host + '/api',
  login: host + '/api/login',
  check_openid: host + '/api/check_openid',
  env: env,
  mapKey: '',
  appid: ''
}