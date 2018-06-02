import wepy from 'wepy'
import tip from './tip'
import Host from '../utils/host';
import Session from '../utils/session'
const SESSION_LOGIN_KEY = 'weapp_login_session'

const wxRequest = async(params = {}, url) => {
	let data = params.query || {}
	let res = {}
	
	if (Host.env == 0) {
		// 测试环境不进行授权登录，直接请求接口
		res = await doRequest(params, url)
	} else {
		if (Session.get(SESSION_LOGIN_KEY) == null) {
			await checkOpenid()
			res = await doRequest(params, url)
		} else {
			res = await doRequest(params, url)
			if (res.data.status == 301) {
				// Session 过期，清除本地 Session 后重新登录
				Session.clear(SESSION_LOGIN_KEY)
				await checkOpenid()
				res = await doRequest(params, url)
			}
		}
	}
	return res;
};

const doRequest = async (params = {}, url) => {
	let data = params.query || {};
	const res = await wepy.request({
		url: url,
		method: params.method || 'GET',
		data: data,
		header: { 'Content-Type': 'application/json', 'X-WX-Skey': Session.get(SESSION_LOGIN_KEY) },
	})

	if (params.addCache) {
		Session.set(params.addCache, res)
	}
	return res
}

// 登录获取OpenId
const checkOpenid = async () => {
	const wxLogin = await wepy.login();
	const header = {
		'X-WX-Code': wxLogin.code
	}
	const loginResult = await wepy.request({
		url: Host.check_openid,
		method: 'POST',
		header: header
	})

	// 存储用户在服务端的 session 值，以便下次使用
	Session.set(SESSION_LOGIN_KEY, loginResult.data.session)
}

// 小程序上传图片
const wxUpload = async (params = {}, url) => {
  if (params.file_path == undefined) {
    console.log('无效的文件')
    return false
  }
  const uploadResult = await wepy.uploadFile({
    url: url,
    header: {'X-WX-Skey': Session.get(SESSION_LOGIN_KEY)},
    filePath: params.file_path,
    formData: params.query,
    name: 'file'
  })
  return uploadResult
}

module.exports = {
  wxRequest,
  wxUpload
}
