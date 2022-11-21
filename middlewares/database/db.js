const postgusDB = require("./postgusDB")
const moment = require("moment")
const util = require("../../utils/util")
const logger = require("../../utils/logger")
const fs = require('fs')

const config = require("../../config/config.json")
const dbEntrySchema = require("../../models/imgMetaData").imgMetaData

/*
┌─────────────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│ STATUS CODE │ DEFINTIONS                                                                                 │
├─────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│      1      │ db modification was successful because the entry(s) were already added/deleted before hand │
│      0      │ successfully modified the db as expected. no issues                                        │
│     -1      │ failed to modify db due to an issues with PostGus                                          │
│     -2      │ failed to modify db because the inputted param(s) were not formated correctly              │
│     -3      │ failed to modify db because the inputted file path does not exist                          │
└─────────────┴────────────────────────────────────────────────────────────────────────────────────────────┘
*/

async function addImageData(filepath){
    filepath = String(filepath)

    if (fs.existsSync(String(filepath))) {

        const fileDbList = await postgusDB.get( { filepath: filepath } )

        if (fileDbList.result && fileDbList.result.length === 0) {
            
            const entry = {
                filepath: filepath,
                status: "waiting",
                cost: 0,
                uploaded: moment().valueOf(),
                completed: -1,
                timeUnits: "ms",
                finalLabels: {},
                scDataRaw: {},
                usedSignatures: []
            }
    
            const validFormat = util.schemaValidate(dbEntrySchema, entry)
            if (validFormat) {
                const dbOutput = await postgusDB.add(entry)
                if(dbOutput.status === 0){
                    logger.info(`Successfully added db entry for file ${filepath}: ${JSON.stringify(dbOutput)}`)
                    return 0
                }
    
                logger.info(`Failed to add db entry for file ${filepath}: ${JSON.stringify(dbOutput)}`)
                return -1
            }
    
            logger.error(`Failed to add file ${filepath} to db because the file's entry (json) was not formated correctly`)
            return -2        
        }

        logger.error(`Failed to add file ${filepath} to db because the image already has an entry for itself in the db`)
        return 1
    }

    logger.error(`Failed to add file ${filepath} to db because the file does not exist`)
    return -3
}

async function deleteImageData(filepath){
    filepath = String(filepath)

    const fileDbList = await postgusDB.get( { filepath: filepath } )

    if (fileDbList.result && fileDbList.result.length > 0) {

        const dbOutput = await postgusDB.remove({ filepath: filepath })
        if(dbOutput.status === 0){
            logger.info(`Successfully deleted db entry for file ${filepath}. Response: ${JSON.stringify(dbOutput)}`)
            return 0
        }

        logger.info(`Failed to delete db entry for file ${filepath}. Response: ${JSON.stringify(dbOutput)}`)
        return -1
    }

    logger.warn(`Did not remove file ${filepath} data from db because that file's db entry already does not exist`)
    return 1
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

async function editImageData(filepath, keyValue, targets){
    filepath = String(filepath)

    const validKeyValue = await postgusDB.validTargetType(keyValue)
    const validTarget = await postgusDB.validTargetType(targets)
    if (Object.keys(keyValue).length === 1 && validKeyValue && validTarget) {
        
        const fileDbList = await postgusDB.get( { filepath: filepath } ) 
        if (fileDbList.result && fileDbList.result.length > 0) {
            
            let key, value
            for(let k in keyValue){
                key = k
                value = keyValue[k]
                break
            }

            const dbOutput = await postgusDB.edit(key, value, targets)
            if(dbOutput.status === 0){
                logger.info(`Successfully edited db entry for file ${filepath} with keyValue = ${JSON.stringify(keyValue)} and targets = ${JSON.stringify(targets)}. Response: ${JSON.stringify(dbOutput)}`)
                return 0
            }

            logger.info(`Failed to edit db entry for file ${filepath}. Response: ${JSON.stringify(dbOutput)}`)
            return -1
        }

        logger.error(`Failed to edit image db entry for ${filepath} because the entry does not exist in the db`)
    }

    logger.error(`Failed to edit image db entry for ${filepath} because params keyValue and/or targets are formated incorrectly`)
    return -2
}

async function overriseImageData(target, newValue){
    const params = { "target": target, "newValue": newValue }

    const validNewValue = await util.schemaValidate(dbEntrySchema, newValue)

    const validTarget = await util.schemaValidate({ type: "object" }, target)

    if(validNewValue && validTarget){
        const currentEntries = await postgusDB.get(target)
        
        if(currentEntries.status === 0 && currentEntries.result && currentEntries.result.length === 1){
            const dbOutput = await postgusDB.override(target, newValue)
            
            if(dbOutput.status === 0){
                logger.info(`Successfully overided db entry ${JSON.stringify(params)}. Response: ${JSON.stringify(dbOutput)}`)
                return 0
            }
            
            logger.info(`Failed to overided db entry ${JSON.stringify(params)}. Response: ${JSON.stringify(dbOutput)}`)
            return -1
        }

        logger.error(`Failed to overide image db entry for ${JSON.stringify(params)} because the entry does not exist in the db or there is more then one copy in the db: ${JSON.stringify(currentEntries)}`)
    }

    logger.error(`Failed to overide image db entry for ${JSON.stringify(params)} because params keyValue and/or targets are formated incorrectly`)
    return -2
}

module.exports = {
    addImageData,
    deleteImageData,
    getImageData,
    editImageData,
    overriseImageData
}
