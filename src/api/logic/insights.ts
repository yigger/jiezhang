import type Request from '../request'

export interface InsightAmounts {
  income_cents: number
  expend_cents: number
  balance_cents: number
  count: number
}
export interface InsightGroup extends InsightAmounts {
  key: string
  name: string
  ids: number[]
  average_cents: number
  last_date: string
  categories: { id: number; name: string; amount_cents: number; count: number }[]
  statement_ids: number[]
}
export interface InsightReport extends InsightAmounts {
  year: number
  as_of: string
  start_date: string
  end_date: string
  months: (InsightAmounts & { month: number; started: boolean; complete: boolean })[]
  merchants: InsightGroup[]
  members: InsightGroup[]
  large_expenses: {
    id: number
    amount_cents: number
    date: string
    category: string
    description: string
  }[]
  recurring_candidates: {
    key: string
    name: string
    amount_cents: number
    annual_cents: number
    months: number
    due_day: number
    category_id: number
    asset_id: number
    statement_ids: number[]
  }[]
}
export default class Insights {
  constructor(private request: Request) {}
  mergeMerchants(book: number, ids: number[], name: string) {
    return this.request.put<{ id: number }>(`insights/merchants?account_book_id=${book}`, {
      payee_ids: ids,
      name
    })
  }
  workspace(accountBookID: number) {
    return this.request.get<InsightWorkspace>('insights/workspace', {
      account_book_id: accountBookID
    })
  }
  saveProject(book: number, input: InsightProjectInput) {
    return this.request.post<{ id: number }>(`insights/projects?account_book_id=${book}`, input)
  }
  saveFixedCost(book: number, input: InsightFixedCostInput) {
    return this.request.post<{ id: number }>(`insights/fixed_costs?account_book_id=${book}`, input)
  }
  saveAnnotation(book: number, input: InsightAnnotationInput) {
    return this.request.put<{ id: number }>(`insights/annotation?account_book_id=${book}`, input)
  }
  capturePortfolio(book: number, note: string) {
    return this.request.post<{ id: number }>(`insights/portfolio?account_book_id=${book}`, { note })
  }
  report(accountBookID: number, year: number) {
    return this.request.get<InsightReport>('insights/report', {
      account_book_id: accountBookID,
      year
    })
  }
}

export interface InsightProjectInput {
  icon?: string | null
  color?: string | null
  participant_ids?: number[]
  start_date?: string | null
  end_date?: string | null
  id: number
  name: string
  budget_cents: number
  archived: boolean
}
export interface InsightFixedCostInput {
  next_run_date?: string | null
  id: number
  name: string
  amount_cents: number
  category_id: number
  asset_id: number
  interval_months: number
  due_day: number
  candidate_key: string
  active: boolean
}
export interface InsightAllocation {
  member_id: number
  amount_cents: number
}
export interface InsightAnnotationInput {
  consumer_id?: number | null
  statement_id: number
  project_id: number | null
  payer_id: number | null
  fixed_cost_id: number | null
  allocations: InsightAllocation[]
}
export interface InsightPortfolioPoint {
  id: number
  date: string
  note: string
  assets_cents: number
  liabilities_cents: number
  net_cents: number
  delta_cents: number | null
  balances: { id: number; name: string; type: string; amount_cents: number }[]
  changes: {
    id: number
    name: string
    before_cents: number | null
    after_cents: number | null
    net_delta_cents: number
    reason: string
  }[]
}
export interface InsightWorkspace {
  editable_statement_ids: number[]
  projects: (InsightProjectInput & {
    creator_id: number
    can_edit: boolean
    summary: InsightGroup
    payers: InsightGroup[]
  })[]
  fixed_costs: (InsightFixedCostInput & {
    creator_id: number
    can_edit: boolean
    monthly_cents: number
    annual_cents: number
  })[]
  annotations: (InsightAnnotationInput & { can_edit: boolean; split_valid: boolean })[]
  members: { id: number; name: string }[]
  payers: InsightGroup[]
  burdens: InsightGroup[]
  unknown_payer_cents: number
  unallocated_cents: number
  invalid_split_count: number
  portfolio: InsightPortfolioPoint[]
  monthly_fixed_cents: number
  annual_fixed_cents: number
}
