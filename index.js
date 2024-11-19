const prayerTime = require('./prayerTime')

const pt = new prayerTime()
times = pt.getTimes(new Date(), { latitude: 27.2046, longitude: 77.4977 })

console.log(times)