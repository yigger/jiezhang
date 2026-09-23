import Taro from '@tarojs/taro'

export class UserCancelled extends Error {
  constructor() {
    super('用户取消操作')
    this.name = 'UserCancelled'
  }
}

export function reportError(error: unknown): void {
  if (error instanceof UserCancelled) return
  const message = error instanceof Error ? error.message : '操作失败，请稍后重试'
  void Taro.showToast({ title: message, icon: 'none' }).catch(() => undefined)
}

export function runTask(promise: PromiseLike<unknown>): void {
  void Promise.resolve(promise).catch(reportError)
}

export function guardEvent<Args extends unknown[], Result>(
  handler: (...args: Args) => Result
): (...args: Args) => Promise<void> {
  return async (...args) => {
    try {
      await handler(...args)
    } catch (error) {
      reportError(error)
    }
  }
}
