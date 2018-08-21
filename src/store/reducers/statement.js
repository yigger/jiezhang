import { handleActions } from 'redux-actions'
import { GETLIST, ADDSTATEMENT, MODIFYSTATEMENT, DELSTATEMENT } from '../types/statement'
import { StatementData } from './data'

export default handleActions({
  [GETLIST](state, result) {
    return {
      ...state,
      statements: result.payload
    }
  },
  [ADDSTATEMENT](state, res) {
    if (state.status === 405) {
      state.statements = [res.payload]
    } else {
      state.statements.unshift(res.payload)
    }
    return {
      ...state
    }
  },
  [MODIFYSTATEMENT](state, res) {
    const statement = res.payload
    for(let index = 0, length = state.statements.length; index < length; ++index) {
      if (state.statements[index]['id'] === statement.id) {
        state.statements[index] = statement
        break;
      }
    }
    return {
      ...state
    }
  },
  [DELSTATEMENT](state, res) {
    for(let index = 0, length = state.statements.length; index < length; index++) {
      if (state.statements[index].id === Number.parseInt(res.payload)) {
        state.statements.splice(index, 1)
        break;
      }
    }
    return {
      ...state
    }
  }

}, StatementData)