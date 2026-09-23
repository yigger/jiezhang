import Taro from '@tarojs/taro'
import { isRecord } from '../api/http-result'

type ModalResult = Taro.showModal.SuccessCallbackResult & { content: string }
type ModalOptions = Omit<Taro.showModal.Option, 'success'> & {
  editable?: boolean
  placeholderText?: string
  inputType?: 'text' | 'number'
  success?: (result: ModalResult) => void | Promise<void>
}

// Taro 4.2's declaration omits WeChat's editable modal extension.
// Keep the platform extension and response validation at this boundary.
export async function showModal({ success, ...options }: ModalOptions): Promise<ModalResult> {
  const response = await Taro.showModal(options)
  const raw: unknown = response
  const content = isRecord(raw) && typeof raw.content === 'string' ? raw.content : ''
  if (options.editable && response.confirm && !(isRecord(raw) && typeof raw.content === 'string')) {
    throw new Error('当前平台不支持输入弹窗')
  }
  const result = { ...response, content }
  await success?.(result)
  return result
}
