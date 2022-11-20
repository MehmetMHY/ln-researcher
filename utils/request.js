const axios = require('axios');
const logger = require("../utils/logger")

const config = require("../config/config.json").requesterConfig

function sleep(ms) {
    return new Promise((resolve) => { setTimeout(resolve, ms) });
}

async function get(url, headers={}) {
    let output = { "status": 0, "response": {} }

    const axiosConfig = {
        url: String(url),
        method: "get",
        timeout: config.timeout,
        headers: Object.assign({
            "Content-Type": "application/json"
            }, headers
        )
    }

    let attempt = 0
    while(true){
        if (attempt > config.retries) {
            logger.fatal(`Gave up on GET request to url ${url} with ${JSON.stringify(headers)} after ${config.retries} retries`)
            output["status"] = 1
            break
        }

        try {
            const response = await axios.request(axiosConfig)
            if (response.data) {
                output["response"] = response.data
            } else {
                output["response"] = response
            }
            break
        } catch(err) {
            logger.error(`Failed to make GET request to url ${url} with header ${JSON.stringify(headers)} due to the following error: ${err}`)
            await sleep(config.retryDelay)
        }
        
        attempt += 1
    }

    return output
}

module.exports = {
    get
}
