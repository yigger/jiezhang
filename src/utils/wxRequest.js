import wepy from 'wepy'
import tip from './tip'

const LoginUrl = 'http://git.com/api/login'
// const LoginUrl = 'https://xiaoyounger.com/api/login'
const SESSION_KEY = 'weapp_login_session'

const wxRequest = async(params = {}, url) => {
	let data = params.query || {};
	let res = null

	if (params.showLoading) {
		tip.loading();
	}

	if (SessionLogin.get() == null) {
		return await wxLogin(() => doRequest(params, url))
	} else {
		// Session存在的话直接请求接口
		res = await doRequest(params, url)

		// Session 过期了，清除本地 Session 后重新请求
		if (res.data.status == 301) {
			SessionLogin.clear()
			res = await wxLogin(() => doRequest(params, url))
		}
	}

	if (params.showLoading) {
		tip.loaded();
	}
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

const wxLogin = async (callback = null) => {
	let wxLogin = await wepy.login();
	let wxLoginResult = await wepy.getUserInfo();

	// 1. 取得 wxLoginResult
	let code = wxLogin.code;
	let encryptedData = wxLoginResult.encryptedData;
	let iv = wxLoginResult.iv;
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
	if (callback != null) {
		return await callback()
	}
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
	wxLogin
}
