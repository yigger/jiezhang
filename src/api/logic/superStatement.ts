import type Request from '../request'
import type { Envelope, Query, StatementListItem, SuperTimeResponse } from '../types'

export default class SuperStatement {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  getTime() {
    return this._request.get<Envelope<SuperTimeResponse>>('super_statements/time')
  }

  getStatements(params: Query) {
    return this._request.get<{ data: StatementListItem[] }>('super_statements/list', params)
  }
}
