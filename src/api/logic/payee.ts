import Request from '../request'
import jz from '../../jz'

export interface PayeeType {
  id: number
  name: string
}

export default class Payee {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  async list(): Promise<PayeeType[]> {
    const currentAccountBook = jz.storage.getCurrentAccountBook()
    const res = await this._request.get('payees', { account_book_id: currentAccountBook.id })
    return res.data
  }

  async create(payee: PayeeType): Promise<PayeeType> {
    const currentAccountBook = jz.storage.getCurrentAccountBook()
    const res = await this._request.post('payees', { account_book_id: currentAccountBook.id, payee })
    return res.data
  }

  async update(payeeId: string, payee: PayeeType): Promise<PayeeType> {
    const currentAccountBook = jz.storage.getCurrentAccountBook()
    const res = await this._request.put(`payees/${payeeId}`, { account_book_id: currentAccountBook.id, payee })
    return res.data
  }

  async delete(payee: PayeeType): Promise<boolean> {
    const currentAccountBook = jz.storage.getCurrentAccountBook()
    const res = await this._request.delete(`payees/${payee.id}`, { account_book_id: currentAccountBook.id })
    return res.data
  }
}
