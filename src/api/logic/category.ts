import type Request from '../request'
import type {
  CategoryListResponse,
  CategoryShowResponse,
  CategoryWriteRequest,
  Id,
  StatusResponse
} from '../types'

export default class Category {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  getSettingList({ type = 'expend', parent_id = 0 }: { type?: string; parent_id?: Id }) {
    return this._request.get<CategoryListResponse>('categories/category_list', {
      type: type,
      parent_id: parent_id
    })
  }

  getCategoryDetail(id: Id) {
    return this._request.get<CategoryShowResponse>(`categories/${id}`)
  }

  deleteCategory(id: Id) {
    return this._request.delete<StatusResponse>(`categories/${id}`, {})
  }

  getCategoryIcon() {
    return this._request.get<Record<string, string>[]>('icons/categories_with_url')
  }

  updateCategory(id: Id, data: CategoryWriteRequest) {
    return this._request.put<StatusResponse>(`categories/${id}`, data)
  }

  create(data: CategoryWriteRequest) {
    return this._request.post<StatusResponse>('categories', data)
  }
}
