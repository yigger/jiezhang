import Taro from '@tarojs/taro'

export function webPageUrl(path: string): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = path
  return url.href
}

export async function copyWebPage(path: string) {
  const url = webPageUrl(path)
  try {
    await Taro.setClipboardData({ data: url })
    await Taro.showToast({ title: '链接已复制', icon: 'success' })
  } catch {
    await Taro.showModal({ title: '分享链接', content: url, showCancel: false })
  }
}

export function downloadBrowserFile(filePath: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = filePath
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  if (filePath.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(filePath), 60_000)
  }
}
