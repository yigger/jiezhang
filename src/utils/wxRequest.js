import wepy from 'wepy'
import tip from './tip'

const LoginUrl = 'http://git.com/api/login'
// const LoginUrl = 'https://xiaoyounger.com/api/login'
// const LoginUrl = 'https://yiiiblog.com/api/login'
const SESSION_KEY = 'weapp_login_session'

const wxRequest = async(params = {}, url) => {
	let data = params.query || {};
	let res = null

	if (params.showLoading) {
		tip.loading();
	}

	if (SessionLogin.get() == null) {
		const loginResult = await wxLogin().then(async () => {
			return await doRequest(params, url);
		})
		return loginResult
	} else {
		res = await doRequest(params, url)
		if (res.data.status == 301) {
			// Session 过期了，清除本地 Session 后重新请求
			SessionLogin.clear()
			res = await wxLogin().then(async () => {
				return await doRequest(params, url);
			})
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

const wxLogin = async () => {
	let wxLogin = await wepy.login();
	await wepy.getUserInfo().then(async (wxLoginResult) => {
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
	}, (error) => {
		wx.getSetting({
			success(res) {
				if (!res.authSetting['scope.userInfo']) {
					wx.showModal({
						title: '提示',
						content: '必须授权登录之后才能继续操作，是否重新授权登录？',
						showCancel: true,
						success (res) {
							wx.openSetting({
								success (res) {
									
								}
							})
						},
						fail (res) {
							
						}
					});
				}
			}
		})
	});
	
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
