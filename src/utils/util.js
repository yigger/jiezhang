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
  let min = myDate.getMinutes()
  if (parseInt(min) < 10) {
    min = `0${min}`
  }

  let hour = myDate.getHours()
  if (parseInt(hour) < 10) {
    hour = `0${hour}`
  }

  let second = myDate.getSeconds()
  if (parseInt(second) < 10) {
    second = `0${second}`
  }
  return [hour, min, second].join(':')
}

module.exports = {
  getCurrentDate,
  getCurrentTime
}