import jz from '@/jz'
import Request from '../request'
import { FriendInviteRequest, FriendInviteResponse } from '../types'

export default class Friend {
  private readonly _request: Request

  constructor(request: Request) {
    this._request = request
  }

  public async list({
    account_book_id
  }) {
    const st = await this._request.get('friends', { account_book_id: account_book_id })
    return st
  }

  public async invite(data: FriendInviteRequest) {
    const st = await this._request.post<FriendInviteResponse>('friends/invite', data)
    return st
  }

  public async information(token: string) {
    const st = await this._request.get('friends/invite_information', { invite_token: token })
    return st
  }
  
  public async accept(token: string, nickname: string) {
    const st = await this._request.post('friends/accept_apply', { invite_token: token, nickname: nickname  })
    return st
  }

  public async remove(data) {
    const st = await this._request.delete(`friends/${data.collaborator_id}`, { account_book_id: data.account_book_id })
    return st
  }

  public async update(data) {
    const st = await this._request.put(`friends/${data.collaborator_id}`, { account_book_id: data.account_book_id, role: data.role })
    return st
  }
}
