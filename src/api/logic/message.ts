import type Request from '../request'
import type { Id, MessageDetailItem, MessageListItem } from '../types'

export default class Message {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  async getList() {
    return await this._request.get<MessageListItem[]>('message')
  }

  async getMessage(id: Id) {
    return await this._request.get<MessageDetailItem>(`message/${id}`)
  }
}
