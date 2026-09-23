import type Request from '../request'
import type {
  BudgetCategoryDetail,
  BudgetParentItem,
  BudgetSummary,
  FlexibleAmount,
  Id,
  StatusResponse,
  YearMonth
} from '../types'

export default class Budget {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  getSummary({ year, month }: YearMonth) {
    return this._request.get<BudgetSummary>('budgets', { year, month })
  }

  getParentList({ year, month }: YearMonth) {
    return this._request.get<BudgetParentItem[]>('budgets/parent', { year, month })
  }

  getCategoryBudget({ category_id, year, month }: YearMonth & { category_id: Id }) {
    return this._request.get<BudgetCategoryDetail>('budgets/' + category_id, { year, month })
  }

  updateRootAmount({ amount }: { amount: FlexibleAmount }) {
    return this._request.put<StatusResponse>('budgets/0', { type: 'user', amount: amount })
  }

  updateCategoryAmount({ amount, category_id }: { amount: FlexibleAmount; category_id: Id }) {
    return this._request.put<StatusResponse>('budgets/0', {
      type: 'category',
      category_id: category_id,
      amount: amount
    })
  }
}
