export interface TransportResponse<T> {
  data: T
  statusCode: number
  header?: Record<string, unknown>
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export default class HttpResult<T = unknown> {
  constructor(public readonly st: TransportResponse<T>) {}
  get data(): T {
    return this.st.data
  }
  get status(): number {
    return this.st.statusCode
  }
  get header(): Record<string, unknown> {
    return this.st.header ?? {}
  }
  get message(): string {
    if (!isRecord(this.data)) return ''
    const message = this.data.msg ?? this.data.message ?? this.data.error
    return typeof message === 'string' ? message : ''
  }
  get isSuccess(): boolean {
    if (this.status < 200 || this.status >= 300) return false
    if (!isRecord(this.data) || !('status' in this.data)) return true
    return this.data.status === 200 || this.data.status === 'success'
  }
}

export class ApiError extends Error {
  constructor(public readonly result: HttpResult<unknown>) {
    super(result.message || `请求失败（${result.status}）`)
    this.name = 'ApiError'
  }
}
