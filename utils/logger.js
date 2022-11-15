const config = require("../config/config.json")
const pino = require('pino')

// https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/
// https://css-tricks.com/how-to-implement-logging-in-a-node-js-application-with-pino-logger/
module.exports = pino(
    {},
    pino.destination(config.logfile)
)

