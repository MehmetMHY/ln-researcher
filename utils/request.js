const axios = require('axios');

const timeout = 2000
const retries = 1
const retryDelay = 1000

function sleep(ms) {
    return new Promise((resolve) => { setTimeout(resolve, ms) });
}

async function get(url, headers={}) {
    let output = { "status": 0, "response": {} }

    const axiosConfig = {
        url: String(url),
        method: "get",
        timeout: timeout,
        headers: Object.assign({
            "Content-Type": "application/json"
            }, headers
        )
    }

    let attempt = 0
    while(true){
        if (attempt > retries) {
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
            await sleep(retryDelay)
        }
        
        attempt += 1
    }

    return output
}

get("http://localhost:3000/health").then(response => {
    console.log(JSON.stringify(response, null, indent=4))
})

