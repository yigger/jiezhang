export function amountCents(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null
  const [whole, fraction = ''] = value.trim().split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents <= 999999999999 ? cents : null
}
export function equalSplit(amount: number, members: number[]) {
  if (!members.length || !Number.isSafeInteger(amount) || amount < 0) return []
  const base = Math.floor(amount / members.length),
    remainder = amount % members.length
  return members.map((id, index) => ({
    member_id: id,
    amount_cents: base + (index < remainder ? 1 : 0)
  }))
}
