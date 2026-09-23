import jz from '@/jz'
import Taro from '@tarojs/taro'
import type Request from '../request'
import type {
  Envelope,
  Id,
  Query,
  ShareKeyData,
  ShareKeyRequest,
  StatementAssetsResult,
  StatementCategoriesResult,
  StatementDefaultCategoryAssetItem,
  StatementDetailItem,
  StatementFrequentAssetItem,
  StatementFrequentCategoryItem,
  StatementImagesResult,
  StatementListByTokenResult,
  StatementListItem,
  StatementWritePayload,
  StatusResponse
} from '../types'

export default class Statement {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  // 获取创建账单时的分类列表
  async categoriesWithForm(type: string) {
    const cacheCategories = jz.storage.getStatementCategories(type)
    if (cacheCategories) {
      return cacheCategories
    }

    const st = await this._request.get<StatementCategoriesResult>('statements/categories', {
      type: type
    })
    if (st.isSuccess) {
      const data = { frequent: st.data.frequent, data: st.data.categories }
      jz.storage.setStatementCategories(type, data)
      return data
    } else {
      return null
    }
  }

  // 获取创建账单时的资产列表
  async assetsWithForm(params = {}) {
    const cache = jz.storage.getStatementAssets()
    if (cache) {
      return cache
    }

    const st = await this._request.get<StatementAssetsResult>('statements/assets', params)
    if (st.isSuccess) {
      const data = { frequent: st.data.frequent, data: st.data.categories }
      jz.storage.setStatementAssets(data)
      return data
    } else {
      return null
    }
  }

  // 获取最近常用的三个分类
  categoryFrequent(type: string) {
    return this._request.get<StatementFrequentCategoryItem[]>('statements/category_frequent', {
      type: type
    })
  }

  // 获取最近常用的三个资产
  assetFrequent() {
    return this._request.get<StatementFrequentAssetItem[]>('statements/asset_frequent')
  }

  // 获取账单列表
  list(params: Query) {
    return this._request.get<StatementListItem[]>('statements', params)
  }

  getListByToken(token: string, orderBy: string) {
    return this._request.get<Envelope<StatementListByTokenResult>>('statements/list_by_token', {
      token: token,
      order_by: orderBy
    })
  }

  // 创建账单
  create(data: Partial<StatementWritePayload>) {
    return this._request.post<Envelope<StatementDetailItem>>('statements', { statement: data })
  }

  // 更新账单
  update(statementId: Id, data: Partial<StatementWritePayload>) {
    return this._request.put<Envelope<StatementDetailItem>>(`statements/${statementId}`, {
      statement: data
    })
  }

  // 获取账单详情
  getStatement(statementId: Id) {
    return this._request.get<StatementDetailItem>(`statements/${statementId}`)
  }

  // 删除账单
  deleteStatement(statementId: Id) {
    return this._request.delete<StatusResponse>(`statements/${statementId}`)
  }

  // 搜索账单
  searchStatements(keyword: string) {
    return this._request.get<StatementListItem[]>('search', { keyword: keyword })
  }

  // 账单的详情
  getStatementImages() {
    return this._request.get<Envelope<StatementImagesResult>>('statements/images')
  }

  generateShareToken(params: Omit<ShareKeyRequest, 'except_statement_ids'>) {
    return this._request.post<Envelope<ShareKeyData>>('statements/generate_share_key', params)
  }

  pre_check_export() {
    return this._request.post<StatusResponse>('statements/export_check', {})
  }

  async export_excel(timeRange: string) {
    const accessToken = await this._request.getAccessToken()
    const header = {
      'content-type': 'application/json',
      'X-WX-APP-ID': jz.appId,
      'X-WX-Skey': accessToken
    }
    return Taro.downloadFile({
      url: `${this._request._endpoint}/statements/export_excel?range=${encodeURIComponent(timeRange)}`,
      header: header
    })
  }

  targetObjects(statementType: string) {
    return this._request.get<{ data: string[] }>('statements/target_objects', {
      type: statementType
    })
  }

  removeAvatar(statementId: Id, avatar_id: number) {
    return this._request.delete<StatusResponse>(`statements/${statementId}/avatar`, {
      avatar_id: avatar_id
    })
  }

  defaultCategoryAsset(statementType: string) {
    return this._request.get<{ data: StatementDefaultCategoryAssetItem }>(
      'statements/default_category_asset',
      { type: statementType }
    )
  }
}
