import jz from '../../jz'
import type Request from '../request'
import type {
  AccountBookCreateRequest,
  AccountBookDetailItem,
  AccountBookListItem,
  AccountBookPreset,
  AccountBookTypeItem,
  AccountBookUpdateRequest,
  Envelope,
  Id,
  StatusResponse
} from '../types'

export default class AccountBook {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  getAccountBooks() {
    return this._request.get<AccountBookListItem[]>('account_books')
  }

  getAccountBook(id: Id) {
    return this._request.get<Envelope<AccountBookDetailItem>>(`account_books/${id}`)
  }

  getAccountBookTypes() {
    return this._request.get<Envelope<AccountBookTypeItem[]>>('account_books/types')
  }

  getCategoriesList({ accountType }: { accountType: string }) {
    return this._request.get<Envelope<AccountBookPreset>>('account_books/preset_categories', {
      account_type: accountType
    })
  }

  async updateDefaultAccount(accountBook: { id: number; name: string }) {
    const response = await this._request.put<StatusResponse>(
      `account_books/${accountBook.id}/switch`,
      {}
    )
    jz.storage.setCurrentAccountBook(accountBook)
    return response
  }

  create(data: AccountBookCreateRequest) {
    return this._request.post<Envelope<AccountBookDetailItem>>('account_books', data)
  }

  update(id: Id, data: AccountBookUpdateRequest) {
    return this._request.put<Envelope<AccountBookDetailItem>>(`account_books/${id}`, data)
  }

  destroy(id: Id) {
    return this._request.delete<StatusResponse>(`account_books/${id}`)
  }
}
