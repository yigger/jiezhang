import type Request from '../request'
import type {
  Envelope,
  HomeSettingsResponse,
  StatusResponse,
  UserProfile,
  UserUpdatePayload
} from '../types'

export default class User {
  private _request: Request
  constructor(request: Request) {
    this._request = request
  }

  getSettingsData() {
    return this._request.get<HomeSettingsResponse>('settings')
  }

  getUserInfo() {
    return this._request.get<Envelope<UserProfile>>('users')
  }

  updateUserInfo(params: Partial<UserUpdatePayload>) {
    return this._request.put<StatusResponse>('users/update_user', { user: params })
  }

  loginPc(code: string) {
    return this._request.post<StatusResponse>('users/scan_login', { qr_code: code })
  }
}
