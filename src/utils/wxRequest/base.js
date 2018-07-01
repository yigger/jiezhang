import wepy from 'wepy'
import Host from '@/utils/host'
import Session from '@/utils/session'

// 登录凭证键值
const loginKey = Session.key.login

// 登录凭证值
const SessionLoginVal = Session.get(loginKey)

// 获取 openid
const getOpenId = async () => {
  if (SessionLoginVal !== null) {
    return SessionLoginVal
  }
  const wxLogin = await wepy.login();
	const loginResult = await wepy.request({
		url: Host.check_openid,
		method: 'POST',
		header: { 'X-WX-Code': wxLogin.code }
  })
  Session.set(loginKey, loginResult.session)
  return loginResult.session
}

const doRequest = async (url, method, params) => {
  try {
    const result = await wepy.request({
      url: url,
      method: method,
      data: params,
      header: { 'Content-Type': 'application/json', 'X-WX-Skey': await getOpenId() },
    })

    // key 过期尝试重连
    if (result.status === 301) {
      Session.clear(loginKey)
      doRequest(url, method, params)
      return false
    }

    return result
  } catch (e) {
    wx.showToast({
      title: e.errMsg,
      icon: 'none'
    })
  }
}

const wxUpload = async (url, params = {}) => {
  if (params.file_path == undefined) {
    console.log('无效的文件')
    return false
  }
  const uploadResult = await wepy.uploadFile({
    url: url,
    header: { 'Content-Type': 'application/json', 'X-WX-Skey': await getOpenId() },
    filePath: params.file_path,
    formData: params.query,
    name: 'file'
  })
  return uploadResult
}

export default {
  doRequest,
  wxUpload
}



