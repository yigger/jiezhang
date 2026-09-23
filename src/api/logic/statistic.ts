import type Request from '../request'
import type { CalendarDataItem, Envelope, OverviewHeaderData, StatementListItem } from '../types'
export default class Statistic {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  getCalendarData(date: string) {
    return this._request.get<Envelope<CalendarDataItem[]>>('chart/calendar_data', {
      date: date
    })
  }

  getOverviewHeader(date: string) {
    return this._request.get<OverviewHeaderData>('chart/overview_header', {
      date: date
    })
  }

  getOverviewStatements(date: string) {
    return this._request.get<StatementListItem[]>('chart/overview_statements', {
      date: date
    })
  }

  getRate(date: string, type: string) {
    return this._request.get<StatementListItem[]>('chart/rate', {
      date: date,
      type: type
    })
  }
}
