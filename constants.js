// Midnight Mode
const midnightMethods = {
    standard: 'Standard',    // Mid Sunset to Sunrise
    jafari: 'Jafari',      // Mid Sunset to Fajr
}

// Default Parameters in Calculation Methods
const defaultParams = {
    maghrib: 0,
    midnight: midnightMethods.standard
}

const constatnts = {

    // Time Names
    prayerNames: {
        imsak: 'Imsak',
        fajr: 'Fajr',
        sunrise: 'Sunrise',
        dhuhr: 'Dhuhr',
        asr: 'Asr',
        sunset: 'Sunset',
        maghrib: 'Maghrib',
        isha: 'Isha',
        midnight: 'Midnight'
    },

    // default times
    defaultPrayerTimes: {
        imsak: 0, fajr: 0, sunrise: 0, dhuhr: 0,
        asr: 0, sunset: 0, maghrib: 0, isha: 0,
    },

    midnightMethods,

    // Calculation Methods
    methods: {
        MWL: {
            name: 'Muslim World League',
            params: { fajr: 18, isha: 17, ...defaultParams }
        },
        ISNA: {
            name: 'Islamic Society of North America (ISNA)',
            params: { fajr: 15, isha: 15, ...defaultParams }
        },
        Egypt: {
            name: 'Egyptian General Authority of Survey',
            params: { fajr: 19.5, isha: 17.5, ...defaultParams }
        },
        Makkah: {
            name: 'Umm Al-Qura University, Makkah',
            params: { fajr: 18.5, isha: '90 min', ...defaultParams }
            // fajr was 19 degrees before 1430 hijri
        },
        Karachi: {
            name: 'University of Islamic Sciences, Karachi',
            params: { fajr: 18, isha: 18, ...defaultParams }
        },
        Tehran: {
            name: 'Institute of Geophysics, University of Tehran',
            params: { fajr: 17.7, isha: 14, maghrib: 4.5, midnight: midnightMethods.jafari }
        },  // isha is not explicitly specified in this method
        Jafari: {
            name: 'Shia Ithna-Ashari, Leva Institute, Qum',
            params: { fajr: 16, isha: 14, maghrib: 4, midnight: midnightMethods.jafari }
        }
    },

    // Asr Juristic Methods
    asrJuristics: {
        standard: 'Standard',    // Shafi`i, Maliki, Ja`fari, Hanbali
        hanafi: 'Hanafi',       // Hanafi
    },

    // Methods for Higher Latitudes
    highLatMethods: {
        nightMiddle: 'NightMiddle',  // middle of night
        angleBased: 'AngleBased',    // angle/60th of night
        oneSeventh: 'OneSeventh',    // 1/7th of night
        none: 'None',                // No adjustment
    }

}

module.exports = { constatnts }