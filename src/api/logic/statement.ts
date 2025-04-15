import Request from '../request'
import jz from '@/jz'
import Taro from '@tarojs/taro'

export default class Statement {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  // 获取创建账单时的分类列表
  async categoriesWithForm(type: 'income' | 'expend') {
    const cacheCategories = jz.storage.getStatementCategories(type)
    if (cacheCategories) {
      return cacheCategories
    }

    const st = await this._request.get('statements/categories', {type: type})
    if (st.isSuccess) {
      const data = { frequent: st.data.frequent, data: st.data.categories }
      jz.storage.setStatementCategories(type, data)
      return data
    } else {
      return null
    }
  }

  // 获取创建账单时的资产列表
  async assetsWithForm(params={}) {
    const cache = jz.storage.getStatementAssets()
    if (cache) {
      return cache
    }

    const st = await this._request.get('statements/assets', params)
    if (st.isSuccess) {
      const data = { frequent: st.data.frequent, data: st.data.categories }
      jz.storage.setStatementAssets(data)
      return data
    } else {
      return null
    }
  }

  // 获取最近常用的三个分类
  categoryFrequent(type: 'income' | 'expend') {
    return this._request.get('statements/category_frequent', {
      type: type
    })
  }

  // 获取最近常用的三个资产
  assetFrequent() {
    return this._request.get('statements/asset_frequent')
  }

  // 获取账单列表
  list(params) {
    return this._request.get('statements', params)
  }

  getListByToken(token, orderBy) {
    return this._request.get('statements/list_by_token', {token: token, order_by: orderBy})
  }

  // 创建账单
  create(data) {
    return this._request.post('statements', { statement: data })
  }

  // 更新账单
  update(statementId, data) {
    return this._request.put(`statements/${statementId}`, { statement: data })
  }

  // 获取账单详情
  getStatement(statementId: number) {
    return this._request.get(`statements/${statementId}`)
  }

  // 删除账单
  deleteStatement(statementId: number) {
    return this._request.delete(`statements/${statementId}`)
  }

  // 搜索账单
  searchStatements(keyword: string) {
    return this._request.get('search', {keyword: keyword})
  }

  // 账单的详情
  getStatementImages() {
    return this._request.get('statements/images')
  }

  generateShareToken(params) {
    return this._request.post('statements/generate_share_key', params)
  }

  pre_check_export() {
    return this._request.post('statements/export_check', {})
  }

  async export_excel (timeRange: string) {
    const accessToken = await this._request.getAccessToken()
    const header = {
      'content-type': 'application/json',
      'X-WX-APP-ID': jz.appId,
      'X-WX-Skey': accessToken,
    }
    return Taro.downloadFile({
      url: `${this._request._endpoint}/statements/export_excel?range=${timeRange}`,
      header: header
    })
  }

  targetObjects(statementType: string) {
    return this._request.get('statements/target_objects', {type: statementType})
  }

  removeAvatar(statementId: number, avatar_id: number) {
    return this._request.delete(`statements/${statementId}/avatar`, {avatar_id: avatar_id})
  }

  defaultCategoryAsset(statementType: string) {
    return this._request.get('statements/default_category_asset', {type: statementType})
  }
}
