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

    return

    // const scDB = await tools.scGetAllData()
    const scDB = {
        complete: true,
        all: testData["available"].concat(testData["in_progress"], testData["completed"]),
        types: {
            available: testData["available"],
            in_progress: testData["in_progress"],
            completed: testData["completed"]
        }
    }

    const nsCurrentEpoch = await tools.nsCurrentEpoch()
    const notAvailable = scDB.types.in_progress.concat(scDB.types.completed)
    for(let i = 0; i < notAvailable.length; i++) {
        let job = notAvailable[i]
        let lateJobs = job.tasks.filter(task => (!task.time_submitted && task.time_assigned <= nsCurrentEpoch))
        if(lateJobs.length > 0){
            for(let j = 0; j < lateJobs.length; j++){
                let element = lateJobs[j]
                let id = job.id
                let user = element.assigned_to
                if(id && user){
                    console.log(user, ":", id) // TODO, do this with the real smart contract after testing
                    // let scCall = await smartContract.recallTask(config.smartContract.scAccount, id, user)
                    // console.log(JSON.stringify(scCall,null,indent=4))
                }
            }
        }
    }


}

manager().then()