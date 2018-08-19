import { GETLIST, ADDSTATEMENT, MODIFYSTATEMENT, DELSTATEMENT } from '../types/statement'
import { createAction } from 'redux-actions'
import wxRequest from '@/utils/wxRequest'

export const asyncList = createAction(GETLIST, () => {
  return new Promise(async (resolve,reject) => {
    const result = await wxRequest.Get('index')
    resolve(result)
  })
})

export const addStatement = createAction(ADDSTATEMENT, (object) => {
  return object
})

export const modifyStatement = createAction(MODIFYSTATEMENT, (object) => {
  return object
})

export const delStatement = createAction(DELSTATEMENT, (id) => {
  return id
})

