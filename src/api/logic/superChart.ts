import Request from '../request'

export default class SuperChart {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  getHeader(params) {
    return this._request.get('super_chart/header', params)
  }

  getPieData(params) {
    return this._request.get("super_chart/get_pie_data", params)
  }

  getWeekData(params) {
    return this._request.get("super_chart/week_data", params)
  }

  getLineData({ year }) {
    return this._request.get("super_chart/line_chart", { year: year })
  }

  getCategoriesTop({ year, month }) {
    return this._request.get("super_chart/categories_list", { year: year, month: month })
  }
  
  getTableSumary({ year, month }) {
    return this._request.get("super_chart/table_sumary", { year: year, month: month })
  }

}
