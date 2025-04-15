import Request from '../request'
import { HeaderResponse, StatementsResponse } from '../types'

export default class Main {
  private readonly _request: Request

  constructor(request: Request) {
    this._request = request
  }

  public async header(): Promise<HeaderResponse> {
    const st = await this._request.get<HeaderResponse>('header')
    return st
  }
  
  public async statements(range: string): Promise<StatementsResponse> {
    const st = await this._request.get<StatementsResponse>('index', {range})
    return st
  }
}
