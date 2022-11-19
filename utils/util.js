const Ajv = require("ajv")
const logger = require("./logger")
const os = require('child_process')
const request = require("./request")

const config = require("../config/config.json")
const ajv = new Ajv()

async function schemaValidate(schema, data){
    try {
        const validate = ajv.compile(schema)
        const valid = validate(data)
        return valid
    } catch (e) {
        logger.error(`Failed to validate scheme ${JSON.stringify(schema)} for data ${data} : ${e}`)
        return false
    }
}

async function cleanPrint(data){
    console.log(JSON.stringify(data, null, indent=4))
}

function sleep(ms) {
    return new Promise((resolve) => { setTimeout(resolve, ms) });
}

async function nearCurrentPriceUSD(){
    try{
        const url = config.currentNearPriceEndpoint
        const response = await request.get(url)

        if(response.status === 0){
            return response.response.near.usd
        } else {
            logger.error(`Failed to get current price of NEAR from ${config.currentNearPriceEndpoint} due to request failing: ${JSON.stringify(response)}`)
        }

    }catch(e){
        logger.error(`Failed to get the current price of NEAR from ${config.currentNearPriceEndpoint} due to the following error: ${e}`)
    }

    return undefined
}

async function runCmd(cmd) {
    const output = { status: 0, output: {} }
    try { 
        output.output = os.execSync(String(cmd)).toString('utf8')
    } catch (err) {
        logger.error(`Failed to run command ${cmd} in ${runCmd.name} due to the follow error(s): ${err}`)
        output.status = 1
    }
    return output
}

module.exports = {
    schemaValidate,
    cleanPrint,
    sleep,
    nearCurrentPriceUSD,
    runCmd
}
