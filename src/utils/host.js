// 0 开发环境 1 测试环境 2 生产环境
const env = 2

let host = ''
if (env == 0) {
  host = 'http://git.com'
} else if (env == 1) {
  host = 'https://xiaoyounger.com'
} else {
  host = 'https://yiiiblog.com'
}

module.exports = {
  host: host,
  url: host + '/api',
  login: host + '/api/login'
}