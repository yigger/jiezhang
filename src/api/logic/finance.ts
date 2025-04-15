import Request from '../request'
type AssetStatementParams = {
  asset_id: number;
  year: number;
  month: number;
}

export default class Finance {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  async index () {
    return await this._request.get('wallet')
  }

  async getAssetDetail(assetId: number) {
    return await this._request.get('wallet/information', { asset_id: assetId })
  }

  async getAssetTimeline(assetId: number) {
    return await this._request.get('wallet/time_line', { asset_id: assetId })
  }

  async getAssetStatements(params: AssetStatementParams) {
    return await this._request.get('wallet/statement_list', params)
  }

  async updateAmountVisible({visible}) {
    return await this._request.put('users/update_user', { user: { hidden_asset_money: visible } })
  }

}
