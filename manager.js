const { connect, KeyPair, keyStores, utils, providers } = require("near-api-js")
const tools = require("./middlewares/db_manager/tools")
const request = require("./utils/request")
const logger = require("./utils/logger")
const util = require("./utils/util")
const db = require("./middlewares/database/db")
const smartContract = require("./middlewares/smart_contract/nearApi")
const moment = require("moment")
const fs = require("fs")

const config = require("./config/config.json")

const imgFormats = require("./config/fileFormats.json").image
const logName = "[MANAGER]"

// load time limit for job from the smart contract
//  - NOTE: this is far from ideal and it will be reworked
async function getTimeLimitNS(){
    try {
        let TIME_LIMIT = undefined
        let code = fs.readFileSync(`${__dirname}/middlewares/smart_contract/contracts/src/contract.ts`)
        code = code.toString().split("\n")
        TIME_LIMIT = code.filter(line => line.includes("const TIME_LIMIT"))
        TIME_LIMIT = TIME_LIMIT[0]
        TIME_LIMIT = String(TIME_LIMIT).substring(TIME_LIMIT.indexOf("BigInt("), TIME_LIMIT.indexOf(")")).replace(/[^0-9]/g, '')
        return parseFloat(TIME_LIMIT)
    } catch(e) {
        return undefined
    }
}

async function manager(cycle) {
    const apiState = await tools.apiLocalRunning()
    if(!apiState.up){
        logger.fatal(`${logName} [${cycle}] Critical! Image hosting API is down!`)
    }

    let localDB = await db.getImageData()
    if(!localDB){
        logger.fatal(`${logName} [${cycle}] Canceled manager cycle early due to local database failing to load (get json)`)
        return
    }

    // update database for when a data-file is no longer in the data directory or if a new data-file is added to the data directory
    try{
        for(let i = 0; i < 2; i++){
            let currentDataFiles = fs.readdirSync(config.dataDirPath).filter(index => imgFormats.includes(`.${String(index).split(".").at(-1)}`)).sort()
            let dbDataFiles = localDB.map((obj)=>{ return String(obj.filepath).split("/").at(-1) }).sort()

            if(JSON.stringify(currentDataFiles) === JSON.stringify(dbDataFiles)){
                break
            }

            if (currentDataFiles.length > dbDataFiles.length) {
                logger.info(`${logName} [${cycle}] There are ${currentDataFiles.length} physcial files but the db has ${dbDataFiles.length} file entries. Due to this, addAllToDB() was ran`)
                await tools.addAllToDB()
            } else {
                logger.info(`${logName} [${cycle}] There are ${currentDataFiles.length} physcial files but the db has ${dbDataFiles.length} file entries. Due to this, cleanDB() was ran`)
                await tools.cleanDB()
            }

            localDB = await db.getImageData()
            if(!localDB){
                logger.fatal(`${logName} [${cycle}] (2nd call) Canceled manager cycle early due to local database failing to load (get json)`)
                return
            }else{
                logger.info(`${logName} [${cycle}] DB was updated due to physical and saved db entries not aligning`)
            }
        }
    }catch(err){
        logger.fatal(`${logName} [${cycle}] Unexpected error occurred well checking/comparing physic data with database entries: ${err}`)
    }

    // do not processed if all images are labeled (completed)
    const localCompeted = localDB.filter(obj => obj.status === "completed")
    if(localCompeted.length === localDB.length){
        logger.info(`${logName} [${cycle}] Manager stopped because all the images are labeled`)
        return
    }

    let scDB = await tools.scGetAllData()
    if(!scDB.complete){
        logger.fatal(`${logName} [${cycle}] Failed to load smart contract data so manager had to end early this cycle: ${JSON.stringify(scDB)}`)
        return
    }

    const nsTimeLimit = await getTimeLimitNS()
    if(typeof(nsTimeLimit) !== 'number'){
        logger.fatal(`${logName} [${cycle}] Failed to load nsTimeLimit variable from smart contract data so manager had to end early this cycle: ${nsTimeLimit}`)
        return
    }

    // recall any tasks that are taking too long to complete
    let changedJobs = false
    try{
        let changedJobs = false
        const nsCurrentEpoch = await tools.nsCurrentEpoch()
        const notAvailable = scDB.types.in_progress.concat(scDB.types.completed)
        for(let i = 0; i < notAvailable.length; i++) {
            let job = notAvailable[i]
            let lateJobs = job.tasks.filter(task => (!task.time_submitted && Math.abs(task.time_assigned - nsCurrentEpoch) >= nsTimeLimit))
            if(lateJobs.length > 0){
                for(let j = 0; j < lateJobs.length; j++){
                    let element = lateJobs[j]
                    let id = job.id
                    let user = element.assigned_to
                    if(id && user){
                        let scCall = await smartContract.recallTask(config.smartContract.scAccount, id, user)
                        if(scCall.status === 0){
                            logger.info(`${logName} [${cycle}] Removed user ${user} from job ${id} because the job's time out value is ${nsTimeLimit} ns but the job was assigned on epoch ${lateJobs[j].time_assigned} ns and it's currently epoch ${nsCurrentEpoch} ns`)
                            changedJobs = true
                        } else {
                            logger.fatal(`${logName} [${cycle}] FAILED to remove user ${user} from job ${id} because the job's time out value is ${nsTimeLimit} ns but the job was assigned on epoch ${lateJobs[j].time_assigned} ns and it's currently epoch ${nsCurrentEpoch} ns. Error output: ${JSON.stringify(scCall)}`)
                        }
                    } else {
                        logger.error(`${logName} [${cycle}] Failed to recall task(s) taking too long to complete: ${id}, ${user}, ${JSON.stringify(lateJobs)}`)
                    }
                }
            }
        }
    } catch(err) {
        changedJobs = true
        logger.fatal(`${logName} [${cycle}] Unexpected error occurred well trying to recall any tasks that are taking too long to complete: ${err}`)
    }

    if(changedJobs){
        scDB = await tools.scGetAllData()
        if(!scDB.complete){
            logger.fatal(`${logName} [${cycle}] Failed to load smart contract data so manager had to end early this cycle: ${JSON.stringify(scDB)}`)
            return
        }
    }

    // Checking if any data in the local database do not align with the current data in the smart contract's database (json)
    try {
        const scCurrentJobIDS = scDB.all.map((obj)=>{ return obj.id })
        const localCurrentJobs = localDB.filter(obj => scCurrentJobIDS.indexOf(obj.id) > -1)
        const invalidStatus = localCurrentJobs.filter(obj => obj.status === "waiting")
        for(let i = 0; i < invalidStatus.length; i++){
            let dbEntry = invalidStatus[i]
            let scEntry = scDB.all.filter(obj => obj.id === dbEntry.id)[0]
            dbEntry.status = "pending"
            dbEntry.cost = parseFloat(utils.format.formatNearAmount(scEntry.reward))
            let dbEdit = await db.overriseImageData({id: dbEntry.id}, dbEntry)
            if(dbEdit !== 0){
                logger.fatal(`${logName} [${cycle}] Failed to update/overwrite db with new entry: ${JSON.stringify(dbEntry)}. Error code from db.js: ${JSON.stringify(dbEdit)}`)
            } else {
                logger.info(`${logName} [${cycle}] Successfully updated/overwrote db with new entry: ${JSON.stringify(dbEntry)}. Output from db.js: ${JSON.stringify(dbEdit)}`)
            }
        }
    } catch(err) {
        logger.fatal(`${logName} [${cycle}] Unexpected error occurred well trying to check if any data in the local database do not align with the current data in the smart contract's database (json): ${err}`)
    }

    localDB = await db.getImageData()
    if(!localDB){
        logger.fatal(`${logName} [${cycle}] (3rd call) Canceled manager cycle early due to local database failing to load (get json)`)
        return
    }

    // update database with completed jobs (this is very valueable)
    let dbSavedAllCompleted = true
    try {
        const scCompletedJobs = scDB.types.completed
        for(let i = 0; i < scCompletedJobs.length; i++){
            let scEntry = scCompletedJobs[i]
            let dbEntry = localDB.filter(obj => obj.id === scEntry.id)
            dbEntry = dbEntry[0]
            dbEntry.status = "completed"
            dbEntry.cost = parseFloat(utils.format.formatNearAmount(scEntry.reward))
            dbEntry.finalLabels = scEntry.tasks.filter(obj=>obj.assigned_to === scEntry.final_ranking[0])[0].data
            dbEntry.completed = moment().valueOf()
            dbEntry.scDataRaw = scEntry
            dbEntry.usedSignatures = [] // clear used signatures because this image will no longer be hosted in the API
            let dbEdit = await db.overriseImageData({id: dbEntry.id}, dbEntry)
            if(dbEdit !== 0){
                logger.fatal(`${logName} [${cycle}] Failed to update/overwrite completed entry to the db: ${JSON.stringify(dbEntry)}. Error code from db.js: ${JSON.stringify(dbEdit)}. Smart contract db: ${JSON.stringify(scEntry)}`)
                dbSavedAllCompleted = false
            } else {
                logger.info(`${logName} [${cycle}] Successfully updated/overwrote db with completed entry: ${JSON.stringify(dbEntry)}. Output from db.js: ${JSON.stringify(dbEdit)}. Smart contract db: ${JSON.stringify(scEntry)}`)
            }
        }
    } catch(err) {
        dbSavedAllCompleted = false
        logger.fatal(`${logName} [${cycle}] Unexpected error occurred well trying to update the local database with completed jobs from the smart contract: ${err}`)
    }

    try {
        if(dbSavedAllCompleted){
            let scCall = await smartContract.clearCompleted(config.smartContract.scAccount)
            if(scCall.status === 0){
                logger.info(`${logName} [${cycle}] Cleared all completed jobs: ${JSON.stringify(scDB.types.completed)}. Smart Contract output data: ${JSON.stringify(scCall)}`)
                scDB = await tools.scGetAllData()
                if(!scDB.complete){
                    logger.fatal(`${logName} [${cycle}] Failed to load smart contract data so manager had to end early this cycle: ${JSON.stringify(scDB)}`)
                    return
                }
            } else {
                logger.fatal(`${logName} [${cycle}] Failed to clear all completed jobs. Smart Contract output data: ${JSON.stringify(scCall)}`)
            }
        }
    } catch(err) {
        logger.fatal(`${logName} [${cycle}] Unexpected error occurred well trying to clear all complated jobs from the smart contract: ${err}`)
    }

    // add new jobs if the smart contract is not "full"
    try {
        if(scDB.all.length < config.smartContract.maxJobsPerRound){
            let jobQueue = await db.getImageData()
            if(jobQueue){
                jobQueue = jobQueue.filter(obj => obj.status === "waiting")
                if(jobQueue.length > 0 && scDB.all.length < config.smartContract.maxJobsPerRound){
                    jobQueue = jobQueue.map((obj)=>{ return {id: obj.id, label_keys: config.whatToLabel } })
                    let numOfNewJobs = Math.abs(config.smartContract.maxJobsPerRound - scDB.all.length)
                    if(numOfNewJobs > jobQueue.length){
                        numOfNewJobs = jobQueue.length
                    }
    
                    const dbSegment = jobQueue.slice(0, numOfNewJobs)
    
                    const avgNearPayment = config.smartContract.paymentPerImageNEAR
                    const totalPayment = avgNearPayment * dbSegment.length
    
                    const addFundsOutput = await smartContract.addFunds(config.smartContract.mainAccount, config.smartContract.scAccount, totalPayment)
                    if(addFundsOutput.status === 0){
                        const addJobsOutput = await smartContract.addJobs(config.smartContract.scAccount, dbSegment)
                        if(addJobsOutput.status !== 0){
                            logger.fatal(`${logName} [${cycle}] An issue occurred well trying to add jobs ${JSON.stringify(dbSegment)} to smart contract ${config.smartContract.scAccount}: ${JSON.stringify(addJobsOutput)}`)
                        }
                    } else {
                        logger.fatal(`${logName} [${cycle}] An issue occurred well trying to add ${totalPayment} NEAR of funds from account ${config.smartContract.mainAccount} to ${config.smartContract.scAccount}: ${JSON.stringify(addFundsOutput)}`)
                    }
                }
            }
        } else {
            logger.info(`${logName} [${cycle}] The smart contract's db (json) is full so no new jobs will be added`)
        }
    } catch(err) {
        logger.fatal(`${logName} [${cycle}] An unexpected error occurred well trying to add new job(s): ${err}`)
    }

    return
}

async function managerLoop(){
    let counter = 0
    while(true){
        await manager(counter)
        await util.sleep(config.managerPauseTimeSeconds*1000)
        counter += 1
    }
}

// // MAIN FUNCTION CALL(S)
managerLoop().then()
