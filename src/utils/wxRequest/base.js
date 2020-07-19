import wepy from 'wepy'
import Host from '@/utils/host'
import Session from '@/utils/session'

// 登录重试次数
let retryCount = 0

// 登录凭证键值
const loginKey = Session.key.login
let getAuthPromise = null

// 获取 openid
const getOpenId = async () => {
  if (Session.get(loginKey) !== null) {
    return Session.get(loginKey)
  }

  // 防止并发请求 openid
  if (getAuthPromise) {
    return getAuthPromise
  }

  return getAuthPromise = new Promise(async (resolve, reject) => {
    const wxLogin = await wepy.login()
    const res = await wepy.request({
      url: Host.check_openid,
      method: 'POST',
      header: { 'X-WX-Code': wxLogin.code, 'X-WX-APP-ID': Host.appid }
    })
    Session.set(loginKey, res.data.session)
    resolve(res.data.session)
  })
}

const doRequest = async (url, method, params, options = {}, callback) => {
  let cacheKey = ''
  // 是否可以命中缓存
  if (options.cacheKey) {
    cacheKey = Session.key[options.cacheKey[0]][options.cacheKey[1]]
    const cache = getByCache(cacheKey)
    if (cache) return cache
  }

  let pageRoutes = []
  const pages = getCurrentPages()
  if (pages.length > 0) {
    for(let p of pages) {
      pageRoutes.push(p.route)
    }
  }
  
  const thirdSession = await getOpenId()
  getAuthPromise = null
  return wepy.request({
    url: url,
    method: method,
    data: params,
    header: {
      'Content-Type': 'application/json',
      'X-WX-Skey': thirdSession,
      'X-WX-APP-ID': Host.appid,
      'X-WX-PAGES': pageRoutes.join(',')
    },
  }).then((response) => {
    const statusCode = response.statusCode
    const result = response.data
    // key 过期尝试重连
    if ((statusCode !== 200 || result.status === 301) && retryCount <= 6) {
      Session.clear(loginKey)
      retryCount += 1
      return doRequest(url, method, params)
    } else {
      retryCount = 0
    }

    if(cacheKey != '') {
      setByCache(cacheKey, result)
    }

    if (typeof callback !== 'undefined') {
      callback(result)
    }

    return result
  }, (err) => {
    Session.pushError({ url: url, method: method, params: params, err: err.message, time: new Date().toLocaleString()})
    wx.showToast({
      title: '请求不可达',
      icon: 'none',
      duration: 3000
    })
  })
}

const wxUpload = async (url, filePath, params = {}) => {
  return await wepy.uploadFile({
    url: url,
    header: { 
      'Content-Type': 'application/json',
      'X-WX-Skey': await getOpenId(),
      'X-WX-APP-ID': Host.appid
    },
    filePath: filePath,
    formData: params,
    name: 'file'
  })
}

// 获取缓存,默认缓存时长 1 天
const getByCache = (cacheKey) => {
  const cacheValue = Session.get(cacheKey)
  const onday = 86400
  // console.log((new Date().getTime() - Number.parseInt(cacheValue.createTime))/1000)
  if (cacheValue === null) {
    return false
  } else if ((new Date().getTime() - Number.parseInt(cacheValue.createTime))/1000 > onday) {
    return false
  }
  return cacheValue.value
}

// 设置缓存
const setByCache = (cacheKey, cacheVal) => {
  if(typeof cacheKey !== 'undefined') {
    if (Array.isArray(cacheVal) && cacheVal.length == 0) return false
    let localTime = new Date().getTime()
    Session.set(cacheKey, {
      createTime: localTime,
      value: cacheVal
    })
  }
}

export default {
  doRequest,
  wxUpload
}



