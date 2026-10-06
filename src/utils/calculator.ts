export interface CalculatorState {
  value: string
  prev: string
  operator: '' | '+' | '-'
  replaceNext: boolean
}

export function initialCalculator(value: string, replaceOnInput = false): CalculatorState {
  return { value: value || '0', prev: '', operator: '', replaceNext: replaceOnInput }
}

function result(state: CalculatorState): string {
  if (!state.operator) return state.value
  const left = Math.round(Number(state.prev) * 100)
  const right = Math.round(Number(state.value) * 100)
  return String((state.operator === '+' ? left + right : left - right) / 100)
}

export function pressCalculatorKey(state: CalculatorState, key: string): CalculatorState {
  if (/^[0-9.]$/.test(key)) {
    const current = state.replaceNext ? '0' : state.value
    if (key === '.' && current.includes('.')) return state
    if (key !== '.' && current.includes('.') && current.split('.')[1].length >= 2) return state
    const value = current === '0' && key !== '.' ? key : current + key
    return { ...state, value, replaceNext: false }
  }
  if (key === '+' || key === '-') {
    if (state.operator && state.replaceNext) return { ...state, operator: key }
    return { value: '0', prev: result(state), operator: key, replaceNext: true }
  }
  if (key === 'OK' || key === '=') {
    return { value: result(state), prev: '', operator: '', replaceNext: true }
  }
  if (key === 'DEL') {
    if (state.operator && state.replaceNext) {
      return { value: state.prev, prev: '', operator: '', replaceNext: false }
    }
    return { ...state, value: state.value.slice(0, -1) || '0', replaceNext: false }
  }
  return state
}
