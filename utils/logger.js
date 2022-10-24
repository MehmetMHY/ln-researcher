const config = require("../config/config.json")
const pino = require('pino')

// https://css-tricks.com/how-to-implement-logging-in-a-node-js-application-with-pino-logger/
module.exports = pino(
    {
        customLevels: {
            debug: 10,
            info: 20,
            warn: 30,
            error: 40,
            fatal: 50
        },
        useOnlyCustomLevels: true,
        level: 'debug'
    },
    pino.destination(config.logfile)
)

