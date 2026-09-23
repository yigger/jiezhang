import type Request from '../request'
import type {
  Id,
  StatementListItem,
  StatusResponse,
  WalletInformation,
  WalletResponse,
  WalletTimelineResponse
} from '../types'

export default class Finance {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  async index() {
    return await this._request.get<WalletResponse>('wallet')
  }

  async getAssetDetail(assetId: Id) {
    return await this._request.get<WalletInformation>('wallet/information', { asset_id: assetId })
  }

  async getAssetTimeline(assetId: Id) {
    return await this._request.get<WalletTimelineResponse>('wallet/time_line', {
      asset_id: assetId
    })
  }

  async getAssetStatements(params: { asset_id: Id; year: number; month: number }) {
    return await this._request.get<{ data: StatementListItem[] }>('wallet/statement_list', params)
  }

  async updateAmountVisible({ visible }: { visible: boolean }) {
    return await this._request.put<StatusResponse>('users/update_user', {
      user: { hidden_asset_money: !visible }
    })
  }
}
