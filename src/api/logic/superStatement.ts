import Request from '../request'

export default class SuperStatement {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  getTime() {
    return this._request.get('super_statements/time')
  }

  getStatements(params) {
    return this._request.get('super_statements/list', params)
  }
}
