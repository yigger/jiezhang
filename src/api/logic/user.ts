import Request from '../request'

export default class User {
  private _request: Request
  constructor (request: Request) {
    this._request = request
  }

  getSettingsData() {
    return this._request.get('settings')
  }
  
  getUserInfo() {
    return this._request.get('users')
  }

  updateUserInfo(params) {
    return this._request.put('users/update_user', { user: params })
  }

  loginPc(code) {
    return this._request.post('users/scan_login', { qr_code: code })
  }
}
