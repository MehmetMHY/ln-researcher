const path = require('path')
const fs = require('fs')
const db = require("../database/db")
const logger = require("../../utils/logger")
const moment = require("moment")
const request = require("../../utils/request")
const smartContract = require("../smart_contract/nearApi")

const testData = require("../smart_contract/test/testSmartContractTestData.json").output

const config = require("../../config/config.json")
const imgFormats = require("../../config/fileFormats.json").image
const dirPath = config.dataDirPath

async function getFilesInDir(dirPath){
    try {
        return await fs.promises.readdir(dirPath)
    } catch (e) {
        logger.error(`Failed to load data on directory ${dirPath} due to the following exception: ${JSON.stringify(e)}`)
        return undefined
    }
}

async function getImgsInDir(dirPath){
    const allFiles = await getFilesInDir(dirPath)
    if(allFiles){
        let filtered = []
        allFiles.forEach(function(element){
            let tmp = element.split(".")
            if(tmp.length > 1 && imgFormats.includes(`.${tmp[tmp.length-1]}`)){
                filtered.push(element)
            }
        })
        return filtered
    }
    return undefined
}

async function addAllToDB(){
    const files = await getImgsInDir(dirPath)

    const stats = {
        ran: false,
        fails: [],
        new: [],
        exists: [],
        runtime: {
            time: 0,
            units: "seconds"
        },
        dir: dirPath
    }

    if(files){
        stats.total = files.length
        stats.ran = true

        const startTime = moment().valueOf()

        for(let i = 0; i < files.length; i++){
            const fullPath = path.join(dirPath, files[i])
            let response = await db.addImageData(fullPath)
            if (response === 0) {
                logger.info(`Successfully added new file ${fullPath} as an entry to the db`)
                stats.new.push(fullPath)
            } else if (response === 1){
                logger.info(`File ${fullPath} already exists in the db so a new instance of it was not added`)
                stats.exists.push(fullPath)
            } else {
                logger.warning(`Failed to add file the following file to the database: ${fullPath}`)
                stats.fails.push(fullPath)
            }
        }

        const processTime = (moment().valueOf() - startTime) / 1000 // seconds

        stats.runtime.time = processTime

        logger.info(`For dir ${dirPath}, ${files.length} files were scanned. ${stats.new.length} new files were added, ${stats.exists.length} files already existed in the db, & ${stats.fails.length} files failed to get added. Full stats: ${JSON.stringify(stats)}`)
    
    } else {
        logger.fatal(`Failed to run addAllToDB() because no files were able to be loaded from dir: ${dirPath}`)
    }

    return stats
}

async function cleanDB(){
    const stats = {
        ran: false,
        removed: [],
        failed: [],
        avoided: [],
        runtime: {
            time: 0,
            units: "seconds"
        },
        dir: dirPath
    }

    const dbEntries = await db.getImageData()

    if(dbEntries){
        stats.ran = true

        const startTime = moment().valueOf()

        for(let i = 0; i < dbEntries.length; i++) {
            let entry = dbEntries[i]
            if (!fs.existsSync(entry.filepath)) {
    
                // do not update any database entries if that image is being worked on
                if(entry.status !== "pending" && entry.status !== "completed"){
                    let response = await db.deleteImageData(entry.filepath)
                    if (response === 0) {
                        logger.info(`Successfully removed file ${entry.filepath} from db because the file does not exist`)
                        stats.removed.push(entry.filepath)
                    } else if (response === 1){
                        logger.info(`File ${entry.filepath}, that does not exist, already does not exist in the db. So it was already deleted from the db`)
                        stats.removed.push(entry.filepath)
                    } else {
                        logger.error(`Failed to remove non-exisitng file from the database: ${entry.filepath}`)
                        stats.failed.push(entry.filepath)
                    }
                } else {
                    logger.fatal(`Failed to remove non-existing file ${entry.filepath} because it is currently in a "pendng" state.`)
                    stats.avoided.push(entry.filepath)
                }
    
            }
        }
    
        const processTime = (moment().valueOf() - startTime) / 1000 // seconds
    
        stats.runtime.time = processTime 

        logger.info(`For dir ${dirPath} ${stats.removed.length} files that do not exist were removed from the db. ${stats.avoided.length} files that do not exist were avoid, due to pending state. And ${stats.failed.length} files that do not exist failed to get deleted from the db. These are the failed files: ${JSON.stringify(stats.failed)}`)

    } else {
        logger.fatal(`Failed to run cleanDB() because db.getImageData() failed to return anything from the db`)
    }

    return stats
}

async function apiLocalRunning(){
    const localhostURL = `http://localhost:${process.env.PORT}/health`
    const response = await request.get(localhostURL)
    const output = { url: localhostURL, response: response, up: true }
    if(response.status !== 0){
        output.up = false
    }
    return output
}

async function scGetAllData(){
    const scAccount = config.smartContract.scAccount
    const allData = await smartContract.getDB(scAccount)
    const allAvailable = await smartContract.getStatus(scAccount, "available")
    const allInProgress = await smartContract.getStatus(scAccount, "in_progress")
    const allCompleted = await smartContract.getStatus(scAccount, "completed")

    let complete = false
    if(allData && allAvailable && allInProgress && allCompleted){
        complete = true
    }

    return {
        complete: complete,
        all: allData,
        types: {
            available: allAvailable,
            in_progress: allInProgress,
            completed: allCompleted
        }
    }
}

async function nsCurrentEpoch(){
    return moment().valueOf()*Math.pow(10,6) // this is not perfect but it works
}

async function scTestData(){
    const output = {
        complete: true,
        all: testData["available"].concat(testData["in_progress"], testData["completed"]),
        types: {
            available: testData["available"],
            in_progress: testData["in_progress"],
            completed: testData["completed"]
        }
    }
    return output
}

module.exports = {
    getFilesInDir,
    getImgsInDir,
    addAllToDB,
    cleanDB,
    apiLocalRunning,
    nsCurrentEpoch,
    scGetAllData,
    scTestData
}
