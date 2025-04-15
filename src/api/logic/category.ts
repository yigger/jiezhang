import Request from '../request'

export default class Category {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  getSettingList({ type = 'expend', parent_id = 0 }) {
    return this._request.get('categories/category_list', {
      type: type,
      parent_id: parent_id
    })
  }

  getCategoryDetail(id) {
    return this._request.get(`categories/${id}`)
  }

  deleteCategory(id) {
    return this._request.delete(`categories/${id}`, {})
  }

  getCategoryIcon() {
    return this._request.get('icons/categories_with_url')
  }

  updateCategory(id, data) {
    return this._request.put(`categories/${id}`, data)
  }

  create(data) {
    return this._request.post('categories', data)
  }
}
