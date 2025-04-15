import Request from '../request'

export default class AccountBook {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  getAccountBooks() {
    return this._request.get('account_books')
  }

  getAccountBook(id) {
    return this._request.get(`account_books/${id}`)
  }

  getAccountBookTypes() {
    return this._request.get('account_books/types')
  }
  
  getCategoriesList({ accountType }) {
    return this._request.get('account_books/preset_categories', { account_type: accountType })
  }

  updateDefaultAccount(accountBook) {
    return this._request.put(`account_books/${accountBook.id}/switch`, {})
  }

  create(data) {
    return this._request.post('account_books', data)
  }

  update(id, data) {
    return this._request.put(`account_books/${id}`, data)
  }

  destroy(id) {
    return this._request.delete(`account_books/${id}`)
  }
}
