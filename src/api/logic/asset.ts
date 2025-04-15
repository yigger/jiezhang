import Request from '../request'

export default class Asset {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  getSettingList({ parentId }) {
    return this._request.get('assets', { parent_id: parentId })
  }

  getAssetDetail(id) {
    return this._request.get(`assets/${id}`)
  }

  deleteAsset(id) {
    return this._request.delete(`assets/${id}`, {})
  }

  getAssetIcon() {
    return this._request.get('icons/assets_with_url')
  }

  updateAsset(id, data) {
    return this._request.put(`assets/${id}`, { wallet: data })
  }

  create(data) {
    return this._request.post('assets', { wallet: data })
  }

  updateAssetAmount(id, amount) {
    return this._request.put(`wallet/surplus`, { asset_id: id, amount: amount })
  }
}
