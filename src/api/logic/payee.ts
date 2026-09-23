import type Request from '../request'
import type { Id, PayeeListItem } from '../types'
export type PayeeType = PayeeListItem
export default class Payee {
  constructor(private readonly request: Request) {}
  async list(): Promise<PayeeType[]> {
    return (await this.request.get<PayeeType[]>('payees')).data
  }
  async create(payee: Pick<PayeeType, 'name'>): Promise<PayeeType> {
    return (await this.request.post<PayeeType>('payees', { payee })).data
  }
  async update(payeeId: Id, payee: Pick<PayeeType, 'name'>): Promise<PayeeType> {
    return (await this.request.put<PayeeType>(`payees/${payeeId}`, { payee })).data
  }
  async delete(payee: PayeeType): Promise<boolean> {
    return (await this.request.delete<{ status: 'success' }>(`payees/${payee.id}`)).isSuccess
  }
}
