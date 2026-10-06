const test = require('node:test')
const assert = require('node:assert/strict')
const createLoader = require('./load-source.cjs')
const { initialCalculator, pressCalculatorKey } = createLoader()('src/utils/calculator.ts')
const press = (state, ...keys) => keys.reduce(pressCalculatorKey, state)

test('suggested amounts are kept until typing, then replaced instead of appended', () => {
  const initial = initialCalculator('90.00', true)
  assert.equal(press(initial, 'OK').value, '90.00')
  assert.equal(press(initial, '2', '5', '.', '5', 'OK').value, '25.5')
  assert.equal(press(initial, '.', '5', 'OK').value, '0.5')
})

test('the existing calculator continues editing digits when replacement is not requested', () => {
  assert.equal(press(initialCalculator('12'), '3').value, '123')
})

test('the second operand retains its operator and does not become the whole amount', () => {
  const state = press(initialCalculator('20'), '+', '5')
  assert.equal(state.operator, '+')
  assert.equal(state.prev, '20')
  assert.equal(state.value, '5')
  assert.equal(press(state, 'OK').value, '25')
})

test('money additions avoid floating point residue', () => {
  assert.equal(press(initialCalculator('0.1'), '+', '0', '.', '2', 'OK').value, '0.3')
  assert.equal(press(initialCalculator('1'), '-', '0', '.', '9', 'OK').value, '0.1')
})

test('continuous operations and replacing an operator keep the intended result', () => {
  assert.equal(press(initialCalculator('20'), '+', '5', '-', '3', 'OK').value, '22')
  assert.equal(press(initialCalculator('20'), '+', '-', '5', 'OK').value, '15')
})

test('input accepts only one decimal point and two fractional digits', () => {
  assert.equal(press(initialCalculator('0'), '1', '.', '2', '.', '3', '4').value, '1.23')
})

test('backspace can cancel an unfilled operation and correct a fractional digit', () => {
  const restored = press(initialCalculator('20'), '+', 'DEL')
  assert.equal(restored.operator, '')
  assert.equal(restored.value, '20')
  assert.equal(press(initialCalculator('1.23'), 'DEL', '4', 'OK').value, '1.24')
})

test('a completed calculation is replaced on the next numeric input', () => {
  assert.equal(press(initialCalculator('20'), '+', '5', '=', '7', 'OK').value, '7')
})
