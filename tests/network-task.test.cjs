const test = require('node:test')
const assert = require('node:assert/strict')
const createLoader = require('./load-source.cjs')
const { networkTask } = createLoader()('src/api/network-task.ts')

test('hung network task rejects and aborts; late completion cannot change the result', async () => {
  let finish
  let aborts = 0
  const task = new Promise((resolve) => {
    finish = resolve
  })
  task.abort = () => {
    aborts++
  }
  const result = networkTask(task, 5, '请求超时')
  await assert.rejects(result, /请求超时/)
  assert.equal(aborts, 1)
  finish('late response')
  await assert.rejects(result, /请求超时/)
})

test('successful network task cancels watchdog without aborting', async () => {
  let aborts = 0
  const task = Promise.resolve('ok')
  task.abort = () => {
    aborts++
  }
  assert.equal(await networkTask(task, 5, '请求超时'), 'ok')
  await new Promise((resolve) => setTimeout(resolve, 15))
  assert.equal(aborts, 0)
})

test('platform timeout and offline objects become readable errors', async () => {
  await assert.rejects(
    networkTask(Promise.reject({ errMsg: 'request:fail timeout' }), 100, '请求超时'),
    /请求超时/
  )
  await assert.rejects(
    networkTask(Promise.reject({ errMsg: 'request:fail offline' }), 100, '请求超时'),
    /网络连接失败/
  )
})
