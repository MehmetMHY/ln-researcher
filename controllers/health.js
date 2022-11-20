const moment = require("moment")
const logger = require("../utils/logger")

async function healthCheckup(req, res) {
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

