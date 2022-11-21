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

const testData = require("./middlewares/smart_contract/test/testSmartContractTestData.json").output

const imgFormats = require("./config/fileFormats.json").image
const logName = "[MANAGER]"

// status: { enum: ["waiting", "pending", "completed"] },

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

async function manager() {
    const apiState = await tools.apiLocalRunning()
    if(!apiState.up){
        logger.fatal(`${logName} Critical! Image hosting API is down!`)
    }

    let localDB = await db.getImageData()
    if(!localDB){
        return
    }

    // do not processed if all images are labeled (completed)
    const localCompeted = localDB.filter(obj => obj.status === "completed")
    if(localCompeted.length === localDB.length){
        return
    }

    // update database for when a data-file is no longer in the data directory or if a new data-file is added to the data directory
    for(let i = 0; i < 2; i++){
        let currentDataFiles = fs.readdirSync(config.dataDirPath).filter(index => imgFormats.includes(`.${String(index).split(".").at(-1)}`)).sort()
        let dbDataFiles = localDB.map((obj)=>{ return String(obj.filepath).split("/").at(-1) }).sort()

        if(JSON.stringify(currentDataFiles) === JSON.stringify(dbDataFiles)){
            break
        }

        if (currentDataFiles.length > dbDataFiles.length) {
            logger.info(`${logName} There are ${currentDataFiles.length} physcial files but the db has ${dbDataFiles.length} file entries. Due to this, addAllToDB() was ran`)
            await tools.addAllToDB()
        } else {
            logger.info(`${logName} There are ${currentDataFiles.length} physcial files but the db has ${dbDataFiles.length} file entries. Due to this, cleanDB() was ran`)
            await tools.cleanDB()
        }

        localDB = await db.getImageData()
        if(!localDB){
            return
        }else{
            logger.info(`${logName} DB was updated due to physical and saved db entries not aligning`)
        }
    }

    let scDB = await tools.scGetAllData()
    // const scDB = {
    //     complete: true,
    //     all: testData["available"].concat(testData["in_progress"], testData["completed"]),
    //     types: {
    //         available: testData["available"],
    //         in_progress: testData["in_progress"],
    //         completed: testData["completed"]
    //     }
    // }

    if(!scDB.complete){
        return
    }

    // const nsTimeLimit = await getTimeLimitNS()
    // if(typeof(nsTimeLimit) !== 'number'){
    //     return
    // }

    // let changedJobs = false
    // const nsCurrentEpoch = await tools.nsCurrentEpoch()
    // const notAvailable = scDB.types.in_progress.concat(scDB.types.completed)
    // for(let i = 0; i < notAvailable.length; i++) {
    //     let job = notAvailable[i]
    //     let lateJobs = job.tasks.filter(task => (!task.time_submitted && Math.abs(task.time_assigned - nsCurrentEpoch) >= nsTimeLimit))
    //     if(lateJobs.length > 0){
    //         for(let j = 0; j < lateJobs.length; j++){
    //             let element = lateJobs[j]
    //             let id = job.id
    //             let user = element.assigned_to
    //             if(id && user){
    //                 let scCall = await smartContract.recallTask(config.smartContract.scAccount, id, user)
    //                 if(scCall.status === 0){
    //                     logger.info(`${logName} Removed user ${user} from job ${id} because the job's time out value is ${nsTimeLimit} ns but the job was assigned on epoch ${lateJobs[j].time_assigned} ns and it's currently epoch ${nsCurrentEpoch} ns`)
    //                     changedJobs = true
    //                 } else {
    //                     logger.fatal(`${logName} FAILED to remove user ${user} from job ${id} because the job's time out value is ${nsTimeLimit} ns but the job was assigned on epoch ${lateJobs[j].time_assigned} ns and it's currently epoch ${nsCurrentEpoch} ns. Error output: ${JSON.stringify(scCall)}`)
    //                 }
    //             }
    //         }
    //     }
    // }

    // if(changedJobs){
    //     scDB = await tools.scGetAllData()
    // }



    // const scCompletedJobs = scDB.types.completed
    // const waitingData = localDB.filter(obj => obj.status === "waiting")
    // console.log(JSON.stringify(waitingData,null,indent=4))
    // console.log(JSON.stringify(localDB, null, indent=4))
    // console.log(JSON.stringify(scDB,null,indent=4))

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
            logger.fatal(`${logName} Failed to update/overwrite db with new entry: ${JSON.stringify(dbEntry)}. Error code from db.js: ${JSON.stringify(dbEdit)}`)
        } else {
            logger.info(`${logName} Successfully updated/overwrote db with new entry: ${JSON.stringify(dbEntry)}. Error code from db.js: ${JSON.stringify(dbEdit)}`)
        }
    }



    // console.log(JSON.stringify(invalidStatus,null,indent=4))
}

manager().then()
// {
//     "id": "4615dfd3-98c6-40b3-971f-073449f05faa",
//     "reward": "10050000000000000000000000",
//     "expires": "1669009360664899617",
//     "label_keys": [
//         "corn-plants",
//         "dirt",
//         "rocks"
//     ],
//     "tasks": []
// }