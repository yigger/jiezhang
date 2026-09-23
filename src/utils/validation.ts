import { isRecord } from '../api/http-result'
import type { WalletResponse } from '../api/types'
function hasStrings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === 'string')
}

function isTypeSummary(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasStrings(value, ['name', 'amount']) &&
    Array.isArray(value.childs) &&
    value.childs.every(
      (child: unknown) =>
        isRecord(child) &&
        typeof child.category_id === 'number' &&
        hasStrings(child, ['name', 'amount'])
    )
  )
}

export function isWalletResponse(value: unknown): value is WalletResponse {
  if (!isRecord(value) || !isRecord(value.header) || !Array.isArray(value.list)) return false
  return (
    typeof value.amount_visible === 'boolean' &&
    hasStrings(value.header, ['total_asset', 'net_worth', 'total_liability']) &&
    value.list.every(
      (item: unknown) =>
        isRecord(item) &&
        hasStrings(item, ['name', 'amount']) &&
        Array.isArray(item.childs) &&
        item.childs.every(
          (child: unknown) =>
            isRecord(child) &&
            typeof child.id === 'number' &&
            hasStrings(child, ['name', 'amount', 'icon_path'])
        )
    ) &&
    isTypeSummary(value.receivables) &&
    isTypeSummary(value.payables)
  )
}

export function parsePositiveAmount(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function displayAmount(amount: string | number, visible: boolean): string {
  return visible ? String(amount) : '****'
}
