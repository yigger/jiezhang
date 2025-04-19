import Request from '../request'

export default class Budget {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  getSummary({
    year: year,
    month: month
  }) {
    return this._request.get('budgets', { year, month })
  }

  getParentList({
    year: year,
    month: month
  }) {
    return this._request.get('budgets/parent', { year, month })
  }

  getCategoryBudget({category_id, year, month}) {
    return this._request.get('budgets/' + category_id, { year, month })
  }

  updateRootAmount({amount}) {
    return this._request.put('budgets/0', { type: 'user', amount: amount})
  }

  updateCategoryAmount({amount, category_id}) {
    return this._request.put('budgets/0', { type: 'category', category_id: category_id, amount: amount})
  }
}
