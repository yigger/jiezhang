import { appPages, appSubPackages } from '@/src/config/pages'
import Taro from '@tarojs/taro'
import { webPageUrl } from './web'

export const WEB_LOGIN_PAGE = '/pages/web_login/index'
const HOME_PAGE = '/pages/home/index'
const pages = new Set([
  ...appPages.map((page) => `/${page}`),
  ...appSubPackages.flatMap(({ root, pages: subPages }) =>
    subPages.map((page) => `/${root}/${page}`)
  )
])

function validReturnUrl(url: string) {
  const path = url.split('?')[0]
  return pages.has(path) && path !== WEB_LOGIN_PAGE && !url.includes('#') ? url : HOME_PAGE
}

export function getWebReturnUrl(encodedUrl?: string) {
  try {
    return validReturnUrl(decodeURIComponent(encodedUrl || HOME_PAGE))
  } catch {
    return HOME_PAGE
  }
}

export function webLoginUrl(returnUrl: string) {
  return `${WEB_LOGIN_PAGE}?returnTo=${encodeURIComponent(validReturnUrl(returnUrl))}`
}

export function prepareWebLaunch() {
  const route = window.location.hash.slice(1)
  if (route.split('?')[0] === WEB_LOGIN_PAGE) return
  window.history.replaceState(window.history.state, '', webPageUrl(webLoginUrl(route)))
}

let redirecting: Promise<unknown> | undefined

export function requireWebLogin(): Promise<unknown> {
  const route = window.location.hash.slice(1)
  if (route.split('?')[0] === WEB_LOGIN_PAGE) return Promise.resolve()
  // Concurrent failed API calls must cause only one route transition.
  if (!redirecting) {
    redirecting = Taro.reLaunch({ url: webLoginUrl(route) }).finally(() => {
      redirecting = undefined
    })
  }
  return redirecting
}
