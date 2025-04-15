export default class HttpResult {
  
  public data: any
  public message: string
  public status: number
  public header: any
  public st: any

  constructor (st) {
    this.st = st
    this.data = st.data
    this.status = st.statusCode
    this.header = st.header
  }

  get isSuccess(): boolean {
    return this.status === 200
  }

}