const moment = require('moment')
const { constatnts } = require('./constants')
const { DMath } = require('./Dmaths')

class prayerTime {

    setting = {}
    coordinates = []
    timeFormat = ''
    timezone = ''
    DST = ''
    jDate = 0

    constructor(method) {
        this.calcMethod = constatnts.methods[method] ? method : 'Karachi'
        this.setting = {
            imsak: 10, // Value in minutes
            dhuhr: 0,  // Value in minutes
            asr: constatnts.asrJuristics.standard,
            highLats: constatnts.highLatMethods.nightMiddle,
            ...constatnts.methods[this.calcMethod].params
        }
    }

    // set calculation method
    setCalcMethod(method) {
        if (constatnts.methods[method]) {
            this.calcMethod = method
            this.adjustSetting({ ...constatnts.methods[method].params })
        }
    }

    // set calculating parameters
    adjustSetting = (params) => this.setting += params

    // return prayer times for a given date
    getTimes(date, coordinates, timezone, timeFormat) {
        this.coordinates = { latitude: 0, longitude: 0, elevation: 0, ...coordinates }
        this.timeZone = (timezone ?? date.getTimezoneOffset()) + Number(moment(date).isDST())
        this.timeFormat = timeFormat ?? timeFormat
        this.jDate = this.julian(date) - this.coordinates.longitude / (15 * 24)
        return this.computeTimes();
    }

    // compute prayer times
    computeTimes() {
        const calculatedTimes = this.adjustTimes(this.computePrayerTimes(constatnts.defaultPrayerTimes));
        // add midnight time
        calculatedTimes.midnight = (this.setting.midnight === constatnts.midnightMethods.jafari) ?
            calculatedTimes.sunset + this.timeDiff(calculatedTimes.sunset, calculatedTimes.fajr) / 2 :
            calculatedTimes.sunset + this.timeDiff(calculatedTimes.sunset, calculatedTimes.sunrise) / 2;
        // return this.tuneTimes(times)  // apply offsets to the times
        return this.modifyFormats(calculatedTimes)  // convert times to given time format
    }

    // compute prayer times at given julian date
    computePrayerTimes(defPTimes) {

        const imsak = this.sunAngleTime(this.setting.imsak, this.dayPortion(defPTimes.imsak), 'ccw')
        const fajr = this.sunAngleTime(this.setting.fajr, this.dayPortion(defPTimes.fajr), 'ccw')
        const sunrise = this.sunAngleTime(this.riseSetAngle(this.coordinates.elevation), this.dayPortion(defPTimes.sunrise), 'ccw')
        const dhuhr = this.midDay(this.sunPosition(this.jDate + this.dayPortion(defPTimes.dhuhr)))
        const asr = this.asrTime(this.asrFactor(this.setting.asr), this.dayPortion(defPTimes.asr))
        const sunset = this.sunAngleTime(this.riseSetAngle(this.coordinates.elevation), this.dayPortion(defPTimes.sunset))
        const maghrib = this.sunAngleTime(this.setting.maghrib, this.dayPortion(defPTimes.maghrib))
        const isha = this.sunAngleTime(this.setting.isha, this.dayPortion(defPTimes.isha))

        return { imsak, fajr, sunrise, dhuhr, asr, sunset, maghrib, isha }
    }

    // compute the time at which sun reaches a specific angle below horizon
    sunAngleTime = (angle, time, direction) => {
        const sunPos = this.sunPosition(this.jDate + time)
        const decl = sunPos.declination;
        const noon = this.midDay(sunPos);
        const t = 1 / 15 * DMath.arccos((-DMath.sin(angle) - DMath.sin(decl) * DMath.sin(this.coordinates.latitude)) /
            (DMath.cos(decl) * DMath.cos(this.coordinates.latitude)))
        const sunATime = noon + (direction == 'ccw' ? -t : t)

        return sunATime
    }

    // get asr shadow factor
    asrFactor(asrSetting) {
        const factor = { Standard: 1, Hanafi: 2 }[asrSetting];
        return factor || asrSetting
    }

    // compute asr time
    asrTime(factor, time) {
        const decl = this.sunPosition(this.jDate + time).declination;
        const angle = -DMath.arccot(factor + DMath.tan(Math.abs(this.coordinates.latitude - decl)));
        return this.sunAngleTime(angle, time);
    }

    // adjust times
    adjustTimes(times) {

        for (const i in times)
            times[i] += this.timeZone - this.coordinates.longitude / 15;

        if (this.setting.highLats != constatnts.highLatMethods.none)
            times = this.adjustHighLats(times);

        times.imsak = times.fajr - this.setting.imsak / 60;
        times.maghrib = times.sunset + this.setting.maghrib / 60;
        times.isha = times.maghrib + this.setting.isha / 60;
        times.dhuhr += this.setting.dhuhr / 60

        return times;
    }

    // adjust times for locations in higher latitudes
    adjustHighLats(times) {
        const nightTime = this.timeDiff(times.sunset, times.sunrise);
        times.imsak = this.adjustHLTime(times.imsak, times.sunrise, this.setting.imsak, nightTime, 'ccw');
        times.fajr = this.adjustHLTime(times.fajr, times.sunrise, this.setting.fajr, nightTime, 'ccw');
        times.isha = this.adjustHLTime(times.isha, times.sunset, this.setting.isha, nightTime);
        times.maghrib = this.adjustHLTime(times.maghrib, times.sunset, this.setting.maghrib, nightTime);
        return times;
    }

    // adjust a time for higher latitudes
    adjustHLTime(time, base, angle, night, direction) {
        const portion = this.nightPortion(angle, night)
        const timeDiff = (direction == 'ccw') ? this.timeDiff(time, base) : this.timeDiff(base, time)
        if (isNaN(time) || timeDiff > portion)
            time = base + (direction == 'ccw' ? -portion : portion);
        return time;
    }

    // convert hours to day portions
    dayPortion = (time) => time /= 24

    // the night portion used for adjusting times in higher latitudes
    nightPortion(angle, night) {
        switch (this.setting.highLats) {
            case constatnts.highLatMethods.angleBased:
                return 1 / 60 * angle * night;
            case constatnts.highLatMethods.oneSeventh:
                return 1 / 7 * night
            default: // MidNight
                return 1 / 2 * night
        }
    }

    // convert Gregorian date to Julian day
    // Ref: Astronomical Algorithms by Jean Meeus
    julian = (date) => {
        let [year, month, day] = [moment(date).year(), moment(date).month() + 1, moment(date).date()]
        if (month <= 2) {
            year -= 1;
            month += 12;
        };
        const A = Math.floor(year / 100);
        const B = 2 - A + Math.floor(A / 4);
        const jd = (Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5)

        return jd
    }

    // compute declination angle of sun and equation of time
    // Ref: http://aa.usno.navy.mil/faq/docs/SunApprox.php
    sunPosition = (jd) => {
        const D = jd - 2451545.0;
        const g = DMath.fixAngle(357.529 + 0.98560028 * D);
        const q = DMath.fixAngle(280.459 + 0.98564736 * D);
        const L = DMath.fixAngle(q + 1.915 * DMath.sin(g) + 0.020 * DMath.sin(2 * g));

        const R = 1.00014 - 0.01671 * DMath.cos(g) - 0.00014 * DMath.cos(2 * g);
        const e = 23.439 - 0.00000036 * D;

        const RA = DMath.arctan2(DMath.cos(e) * DMath.sin(L), DMath.cos(L)) / 15;
        const eqt = q / 15 - DMath.fixHour(RA);
        const decl = DMath.arcsin(DMath.sin(e) * DMath.sin(L));

        return { declination: decl, equation: eqt };
    }

    // return sun angle for sunset/sunrise
    riseSetAngle(elevation) {
        //const earthRad = 6371009; // in meters
        //const angle = DMath.arccos(earthRad/(earthRad+ elevation));
        const angle = 0.0347 * Math.sqrt(elevation); // an approximation
        return 0.833 + angle;
    }

    // apply offsets to the times
    // tuneTimes = function (times) {
    //     for (var i in times)
    //         times[i] += offset[i] / 60;
    //     return times;
    // }


    // convert times to given time format
    modifyFormats(times) {
        for (var i in times)
            times[i] = this.getFormattedTime(times[i], '12h');
        return times;
    }

    // convert float time to the given format (see timeFormats)
    getFormattedTime(time, format) {
        if (isNaN(time))
            return invalidTime;

        const suffixes = ['am', 'pm']
        time = DMath.fixHour(time + 0.5 / 60);  // add 0.5 minutes to round
        let hours = Math.floor(time);
        const minutes = Math.floor((time - hours) * 60);
        const suffix = (format == '12h') ? suffixes[hours < 12 ? 0 : 1] : '';
        const hour = (format == '24h') ? this.twoDigitsFormat(hours) : ((hours + 12 - 1) % 12 + 1);
        return hour + ':' + this.twoDigitsFormat(minutes) + (suffix ? ' ' + suffix : '');
    }

    // compute mid-day time
    midDay = (sunPosition) => DMath.fixHour(12 - sunPosition.equation)

    // compute the difference between two times
    timeDiff = (time1, time2) => DMath.fixHour(time2 - time1);

    // add a leading 0 if necessary
    twoDigitsFormat = (num) => (num < 10) ? '0' + num : num;
}

module.exports = prayerTime 