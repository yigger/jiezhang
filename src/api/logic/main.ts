import type Request from '../request'
import type { HomeHeaderResponse, StatementListItem } from '../types'

export default class Main {
  private readonly _request: Request

  constructor(request: Request) {
    this._request = request
  }

  public async header() {
    const st = await this._request.get<HomeHeaderResponse>('header')
    return st
  }

  public async statements(range: string) {
    const st = await this._request.get<StatementListItem[]>('index', { range })
    return st
  }
}
