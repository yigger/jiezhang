import { appPages, appSubPackages } from './config/pages'

export default {
  pages: appPages,
  subPackages: appSubPackages,
  requiredPrivateInfos: ['chooseLocation'],
  window: {
    navigationBarTitleText: 'WeChat',
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle: 'white',
    navigationStyle: 'custom'
  }
}
