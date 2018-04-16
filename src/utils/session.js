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
	}
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