import type Request from '../request'
import type {
  Envelope,
  FriendInviteRequest,
  FriendListResponse,
  Id,
  InviteInformationItem,
  StatusResponse
} from '../types'

export default class Friend {
  private readonly _request: Request

  constructor(request: Request) {
    this._request = request
  }

  public async list({ account_book_id }: { account_book_id: Id }) {
    const st = await this._request.get<Envelope<FriendListResponse>>('friends', {
      account_book_id: account_book_id
    })
    return st
  }

  public async invite(data: FriendInviteRequest) {
    const st = await this._request.post<Envelope<string>>('friends/invite', data)
    return st
  }

  public async information(token: string) {
    const st = await this._request.get<Envelope<InviteInformationItem>>(
      'friends/invite_information',
      { invite_token: token }
    )
    return st
  }

  public async accept(token: string, nickname: string) {
    const st = await this._request.post<StatusResponse>('friends/accept_apply', {
      invite_token: token,
      nickname: nickname
    })
    return st
  }

  public async remove(data: { collaborator_id: Id; account_book_id: Id }) {
    const st = await this._request.delete<StatusResponse>(`friends/${data.collaborator_id}`, {
      account_book_id: data.account_book_id
    })
    return st
  }

  public async update(data: {
    collaborator_id: Id
    account_book_id: Id
    role?: string
    remark?: string
  }) {
    const st = await this._request.put<StatusResponse>(`friends/${data.collaborator_id}`, data)
    return st
  }
}
