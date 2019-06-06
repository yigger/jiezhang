const KEY = {
	category: {
		statementExpendList: "@category_statement_expend@",
		statementIncomeList: "@category_statement_income@",
		expendList: "@category_expend_list@",
		incomeList: "@category_income_list@"
	},
	asset: {
		statementAssets: "@asset_statement@",
		list: "@asset_list@"
	},
	alreadyLogin: "@alreadyLogin@",
	login: 'weapp_login_session',
	bgImageKey: '@user_index_bg@',
	errorKey: '@request_error@',
	localStatementKey: '@local_statement_cache@'
}

module.exports = {
	key: KEY,

	get: function (key) {
		return wx.getStorageSync(key) || null;
	},

	set: function (key, value) {
		wx.setStorageSync(key, value);
	},

	clear: function (key) {
		wx.removeStorageSync(key);
	},
	
	// 排查为何频繁拉取失败
	pushError: function(err) {
		let kV = wx.getStorageSync(KEY['errorKey']) || null
		if (kV === null) {
			kV = [err]
		} else {
			kV.push(err)
		}
		wx.setStorageSync(KEY['errorKey'], kV)
	},

	getErrors: function() {
		return wx.getStorageSync(KEY['errorKey']) || null;
	},

	// 由于网络原因导致账单提交失败的一律先存储到缓存,下次再重新提交
	pushFailStatement: function(statement) {
		let kV = wx.getStorageSync(KEY['localStatementKey']) || null
		if (kV === null) {
			kV = [statement]
		} else {
			kV.push(statement)
		}
		wx.setStorageSync(KEY['localStatementKey'], kV)
	},

	getStatements: function() {
		return wx.getStorageSync(KEY['localStatementKey']) || null;
	},

	clearByKey (item) {
		for(let obj in KEY) {
			if (obj == item) {
				for(let cacheKey in KEY[obj]) {
					wx.removeStorageSync(KEY[obj][cacheKey])
				}
				return false
			}
		}
	},
	
  clearAll: function() {
    wx.clearStorage()
  }
};