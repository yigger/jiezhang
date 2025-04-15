import Request from '../request'
export default class Statistic {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  getCalendarData(date: string) {
    return this._request.get('chart/calendar_data', {
      date: date
    })
  }

  getOverviewHeader(date: string) {
    return this._request.get('chart/overview_header', {
      date: date
    })
  }

  getOverviewStatements(date: string) {
    return this._request.get('chart/overview_statements', {
      date: date
    })
  }

  getRate(date: string, type: string) {
    return this._request.get('chart/rate', {
      date: date,
      type: type
    })
  }

}
