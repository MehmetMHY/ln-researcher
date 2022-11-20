const moment = require("moment")
const logger = require("../utils/logger")

const nameForLog = `[HEALTH_ENDPOINT]`

async function healthCheckup(req, res) {
    logger.info(`${nameForLog} [http v${req.httpVersion}] ${req.method} request was made to endpoint ${req.originalUrl} with header(s) ${JSON.stringify(req.rawHeaders)}`)

    try {
        const time = moment.utc()

        const output = {
            uptime: [process.uptime(), "seconds"],
            timestamp: time.format('MM/DD/YYYY HH:mm:ss z'),
            epoch: [ time.valueOf(), "milliseconds" ],
            running: true
        }

        return res.status(200).json(output)

    } catch (err) {
        logger.error(`Unexpected error occurred in ${healthCheckup.name}; resulting in health endpoint failing. This was the error: ${err}`)

        return res.status(500).send(`unexpected error occurred`)
    }
}

module.exports = {
    healthCheckup
}

