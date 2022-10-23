const config = require("../config/config.json")
const pino = require('pino')

// https://css-tricks.com/how-to-implement-logging-in-a-node-js-application-with-pino-logger/
module.exports = pino(
    {
        customLevels: {
            debug: 20,
            info: 30,
            warn: 40,
            error: 50,
            fatal: 60
        },
        useOnlyCustomLevels: true,
        level: 'info'
    },
    pino.destination(config.logfile)
)

