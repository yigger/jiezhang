import Request from '../request'

export default class Chaos {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  async submitFeedback({ content }) {
    return await this._request.post('settings/feedback', {
      content: content,
      type: 0
    })
  }
}
