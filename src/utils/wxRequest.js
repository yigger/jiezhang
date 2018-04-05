import wepy from 'wepy'
import tip from './tip'

// const LoginUrl = 'http://git.com/api/login'
// const LoginUrl = 'https://xiaoyounger.com/api/login'
const LoginUrl = 'https://yiiiblog.com/api/login'

const SESSION_KEY = 'weapp_login_session'
const wxRequest = async(params = {}, url) => {
	let data = params.query || {};
	let res = null
	// console.log("进来WxRequest" + url)

	if (params.showLoading) {
		tip.loading();
  }
  
	if (SessionLogin.get() == null) {
		const loginResult = await wxLogin()
		// console.log("登录成功-1")
		const requestResult = await doRequest(params, url)
		// console.log("请求成功-1")
		return requestResult
	} else {
		res = await doRequest(params, url)
		if (res.data.status == 301) {
			// Session 过期了，清除本地 Session 后重新请求
			SessionLogin.clear()
			const loginResult = await wxLogin()
			// console.log("登录成功-2")
			res = await doRequest(params, url)
		}
	}

	if (params.showLoading) {
		tip.loaded();
	}
	// console.log("Request 结束")
	return res;
};

const doRequest = async (params = {}, url) => {
	let data = params.query || {};
	let res = await wepy.request({
		url: url,
		method: params.method || 'GET',
		data: data,
		header: { 'Content-Type': 'application/json', 'X-WX-Skey': SessionLogin.get() },
	});
	return res
}

const wxLogin = async () => {
	let wxLogin = await wepy.login();
	let userinfoRaw  = {}
	try {
		if (wxLogin.code) {
			userinfoRaw = await wepy.getUserInfo()
		} else {
			// 登录获取 code 失败
			console.log("获取 code 失败")
			tip.loaded();
		}
	} catch (e)  {
		tip.loaded();
		console.log("获取用户信息失败")
		let status = await wepy.showModal({
			title: '登录提示',
			content: `必须授权登录之后才能继续操作，是否重新授权登录？`,
			cancelText: '不了',
			cancelColor: '#666666',
			confirmText: '好的',
			confirmColor: '#3CC51F'
		})

		if (status.confirm) {
			let res = await wepy.openSetting()
			if (res && res.authSetting['scope.userInfo']) {
				try {
					userinfoRaw = await wepy.getUserInfo()
					await wepy.showToast({
							title: '重新登录成功',
							icon: 'success',
					})
				} catch (e) {
					console.log('再次getUserInfo失败！')
					return
				}
			} else {
				await wepy.showToast({
					title: '请授权用户信息',
				})
			}
		} else {
			// 用户拒绝授权
			return
		}
	}

	// 实现真正的请求
	//1. 取得 userinfoRaw
	let code = wxLogin.code;
	let encryptedData = userinfoRaw.encryptedData;
	let iv = userinfoRaw.iv;
	let header = {};

	// 2. 构造请求头，包含 code、encryptedData 和 iv
	header['X-WX-Code'] = code;
	header['X-WX-Encrypted-Data'] = encryptedData;
	header['X-WX-IV'] = iv;

	// 3. 请求服务端，获取会话信息
	const loginResult = await wepy.request({
		url: LoginUrl,
		method: 'POST',
		header: header
	});

	// 4. 存储用户在服务端的 session 值，以便下次使用
	SessionLogin.set(loginResult.data.session);
}

const wxUpload = async (params = {}, url) => {
  if (params.file_path == undefined) {
    console.log('无效的文件')
    return false
  }
  const uploadResult = await wepy.uploadFile({
    url: url,
    header: {'X-WX-Skey': SessionLogin.get()},
    filePath: params.file_path,
    formData: params.query,
    name: 'file'
  })
  return uploadResult
}

const SessionLogin = {
	get: function () {
		return wx.getStorageSync(SESSION_KEY) || null;
	},

	set: function (session) {
		wx.setStorageSync(SESSION_KEY, session);
	},

	clear: function () {
		wx.removeStorageSync(SESSION_KEY);
	},
};

module.exports = {
  wxRequest,
  wxUpload
}
