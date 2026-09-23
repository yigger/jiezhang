import type Request from '../request'
import type { StatusResponse } from '../types'

export default class Chaos {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  async submitFeedback({ content }: { content: string }) {
    return await this._request.post<StatusResponse>('settings/feedback', {
      content: content,
      type: 0
    })
  }
}
