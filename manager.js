const tools = require("./middlewares/db_manager/tools")
const request = require("./utils/request")
const logger = require("./utils/logger")
const util = require("./utils/util")
const db = require("./middlewares/database/db")
const smartContract = require("./middlewares/smart_contract/nearApi")
const moment = require("moment")

const config = require("./config/config.json")

const testData = require("./middlewares/smart_contract/test/testSmartContractTestData.json").output

const logName = "[MANAGER]"

// status: { enum: ["waiting", "pending", "completed"] },

async function manager() {
    const apiState = await tools.apiLocalRunning()
    if(!apiState.up){
        logger.fatal(`${logName} Critical! Image hosting API is down!`)
    }

    const localDB = await db.getImageData()

    // do not processed if all images are labeled (completed)
    const localCompeted = localDB.filter(obj => obj.status === "completed")
    if(localCompeted.length === localDB.length){
        return
    }

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
    // console.log(await tools.scGetAllData())

    let takingToLong = []
    const nsCurrentEpoch = await tools.nsCurrentEpoch()
    const notAvailable = scDB.types.in_progress.concat(scDB.types.completed)
    // for(let i = 0; i < notAvailable.length; i++){
    //     let entry = notAvailable[i].tasks.filter(task => (!task.time_submitted && task.time_assigned <= nsCurrentEpoch))
    //     if(entry.length > 0){
    //         entry.forEach(element => {
    //             takingToLong.push({
    //                 id: entry.id,
    //                 user: element.assigned_to
    //             })
    //         })
    //     }
    // }

    notAvailable.forEach(job => {
        let lateJobs = job.tasks.filter(task => (!task.time_submitted && task.time_assigned <= nsCurrentEpoch))
        console.log(lateJobs, "\n")
        if(lateJobs.length > 0){
            console.log(lateJobs)
            lateJobs.forEach(element => {
                takingToLong.push({
                    id: job.id,
                    user: element.assigned_to
                })
            })
        }
    })
    console.log(takingToLong)
}

manager().then()