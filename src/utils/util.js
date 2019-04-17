function getCurrentDate() {
  const myDate = new Date()
  let year = myDate.getFullYear()
  let month = myDate.getMonth() + 1
  let day = myDate.getDate()
  if (month < 10) month = `0${month}`
  if (day < 10) day = `0${day}`
  return [year, month, day].join('-')
}

function getCurrentTime() {
  const myDate = new Date()
  return [myDate.getHours(), myDate.getMinutes(), myDate.getSeconds()].join(':')
}

module.exports = {
  getCurrentDate,
  getCurrentTime
}