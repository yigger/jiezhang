import Request from '../request'

export default class Message {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  async getList () {
    return await this._request.get('message')
  }

  async getMessage (id) {
    return await this._request.get(`message/${id}`)
  }
}
