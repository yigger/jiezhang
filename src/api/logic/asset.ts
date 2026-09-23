import type Request from '../request'
import type {
  AssetItem,
  AssetShowResponse,
  AssetWriteRequest,
  FlexibleAmount,
  Id,
  StatusResponse
} from '../types'

export default class Asset {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  getSettingList({ parentId }: { parentId: Id }) {
    return this._request.get<AssetItem[]>('assets', { parent_id: parentId })
  }

  getAssetDetail(id: Id) {
    return this._request.get<AssetShowResponse>(`assets/${id}`)
  }

  deleteAsset(id: Id) {
    return this._request.delete<StatusResponse>(`assets/${id}`, {})
  }

  getAssetIcon() {
    return this._request.get<Record<string, string>[]>('icons/assets_with_url')
  }

  updateAsset(id: Id, data: AssetWriteRequest['wallet']) {
    return this._request.put<StatusResponse>(`assets/${id}`, { wallet: data })
  }

  create(data: AssetWriteRequest['wallet']) {
    return this._request.post<StatusResponse>('assets', { wallet: data })
  }

  updateAssetAmount(id: Id, amount: FlexibleAmount) {
    return this._request.put<StatusResponse>(`wallet/surplus`, { asset_id: id, amount: amount })
  }
}
