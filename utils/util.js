const Ajv = require("ajv")
const logger = require("./logger")

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

module.exports = {
    schemaValidate,
    cleanPrint
}
