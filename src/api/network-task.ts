export const REQUEST_TIMEOUT = 15_000
export const UPLOAD_TIMEOUT = 30_000

// Also bound the promise when a platform fails to deliver its timeout callback.
export function networkTask<T>(
  task: PromiseLike<T> & { abort?: () => void },
  timeout: number,
  timeoutMessage: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage))
      try {
        task.abort?.()
      } catch {
        // The caller must still recover if cancellation is unsupported.
      }
    }, timeout)
    Promise.resolve(task).then(
      (result) => {
        clearTimeout(timer)
        resolve(result)
      },
      (error: unknown) => {
        clearTimeout(timer)
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null && 'errMsg' in error
              ? String(error.errMsg)
              : ''
        reject(
          new Error(
            /timeout|timed out/i.test(message) ? timeoutMessage : '网络连接失败，请检查网络后重试'
          )
        )
      }
    )
  })
}
