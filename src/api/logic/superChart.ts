import type Request from '../request'
import type {
  Envelope,
  SuperCategoryTopItem,
  SuperChartHeaderData,
  SuperLineChartData,
  SuperPieItem,
  SuperTableSummaryItem,
  SuperWeekData,
  YearMonth
} from '../types'

export default class SuperChart {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  getHeader(params: YearMonth) {
    return this._request.get<{ data: SuperChartHeaderData }>('super_chart/header', params)
  }

  getPieData(params: YearMonth & { type: string }) {
    return this._request.get<{ data: SuperPieItem[] }>('super_chart/get_pie_data', params)
  }

  getWeekData(params: YearMonth) {
    return this._request.get<SuperWeekData>('super_chart/week_data', params)
  }

  getLineData({ year }: { year: string | number }) {
    return this._request.get<SuperLineChartData>('super_chart/line_chart', { year: year })
  }

  getCategoriesTop({ year, month }: YearMonth) {
    return this._request.get<{ data: SuperCategoryTopItem[] }>('super_chart/categories_list', {
      year: year,
      month: month
    })
  }

  getTableSumary({ year, month }: YearMonth) {
    return this._request.get<Envelope<SuperTableSummaryItem[]>>('super_chart/table_sumary', {
      year: year,
      month: month
    })
  }
}
