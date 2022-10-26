const postgusDB = require("./postgusDB")
const moment = require("moment")
const util = require("../../utils/util")
const logger = require("../../utils/logger")
const fs = require('fs')

const config = require("../../config/config.json")
const dbEntrySchema = require("../../models/imgMetaData").imgMetaData

async function addImageData(filepath, value){
    filepath = String(filepath)

    if (fs.existsSync(String(filepath))) {

        const fileDbList = await postgusDB.get( { filepath: filepath } )

        if (fileDbList.result && fileDbList.result.length === 0) {
            const entry = {
                filepath: filepath,
                status: "waiting",
                image: { raw: {}, label: {} },
                value: value,
                timeLogs: {
                  uploaded: moment().valueOf(),
                  completed: -1,
                  units: "ms"
                },
                labelers: []
            }
    
            const validFormat = util.schemaValidate(dbEntrySchema, entry)
            if (validFormat) {
                const dbOutput = await postgusDB.add(entry)
                if(dbOutput.status === 0){
                    logger.info(`Successfully added db entry for file ${filepath} with value ${value}: ${JSON.stringify(dbOutput)}`)
                    return true
                }
    
                logger.info(`Failed to add db entry for file ${filepath} with value ${value}: ${JSON.stringify(dbOutput)}`)
                return false
            }
    
            logger.error(`Failed to add file ${filepath} with value ${value} to db because the file's entry (json) was not formated correctly`)
            return false            
        }

        logger.error(`Failed to add file ${filepath} with value ${value} to db because the image already has an entry for itself in the db`)
        return false
    }

    logger.error(`Failed to add file ${filepath} with value ${value} to db because the file does not exist`)
    return false
}

async function deleteImageData(filepath){
    filepath = String(filepath)

    if (fs.existsSync(String(filepath))) {

        const fileDbList = await postgusDB.get( { filepath: filepath } )

        if (fileDbList.result && fileDbList.result.length > 0) {
    
            const dbOutput = await postgusDB.remove({ filepath: filepath })
            if(dbOutput.status === 0){
                logger.info(`Successfully deleted db entry for file ${filepath}. Response: ${JSON.stringify(dbOutput)}`)
                return true
            }

            logger.info(`Failed to delete db entry for file ${filepath}. Response: ${JSON.stringify(dbOutput)}`)
            return false         
        }

        logger.error(`Failed to remove file ${filepath} from db because the image does not exist in the db`)
        return false
    }

    logger.error(`Failed to remove file ${filepath} from db because the file does not exist`)
    return false
}

async function getImageData(details=undefined){
    if (details === undefined) {
        const response = await postgusDB.get()
        if (response.status === 0) {
            return response.result
        }
    }
    
    if (postgusDB.validTargetType(details)) {
        const response = await postgusDB.get(details)
        if (response.status === 0) {
            return response.result
        }
    }

    return undefined
}

module.exports = {
    addImageData,
    deleteImageData,
    getImageData
}

