const moment = require("moment")
const util = require("../../utils/util")
const db = require("../database/db")
const logger = require("../../utils/logger")
const manager = require("../db_manager/tools")
const smartContract = require("../smart_contract/nearApi")
const config = require("../../config/config.json")
const nearAPI = require("near-api-js");

const nameForLog = `[currentState]`

async function percentStr(amount, total, places=2){
    const output = parseFloat((amount / total)*100).toFixed(places)
    return `${output}%`
}

async function displayState(){
    try {
        const statusCounter = { "waiting": 0, "pending": 0, "completed": 0 }

        let details = {}
    
        let totalNearSpent = 0
        let totalCost = 0
        let completedTime = []
    
        let database = undefined
        let dbSize = undefined
        try {
            database = await db.getImageData()
            dbSize = database.length
            for(let i = 0; i < database.length; i++){
                let entry = database[i]
                
                if(entry.status in statusCounter){
                    statusCounter[entry.status] += 1
                }
        
                if(entry.status.toLowerCase() === "completed"){
                    totalNearSpent += entry.cost
                    if(entry.uploaded >= 0 && entry.completed >= 0){
                        completedTime.push(entry.completed-entry.uploaded) // millisecond
                    }
                }
        
                totalCost += entry.cost
            }
        
            details["dbSize"] = dbSize
            details["state"] = statusCounter
            details["totalNearSpent"] = totalNearSpent
            details["totalCost"] = totalCost
        } catch(e) {
            logger.error(`${nameForLog} The following unexpected error occurred (db set to undefined): ${e}`)
            database = undefined
        }
    
        let avgCompletedTime = -1
        if(database && completedTime.length > 0){
            if(completedTime.length > 0){
                details["avgCompleteTime"] = completedTime.reduce((a, b) => a + b) / completedTime.length
                details["avgCompleteTime"] = `${details["avgCompleteTime"]} ms`
            }
    
            details["avgCompleteTime"] = avgCompletedTime
        }
    
        const priceOfNear = String(await util.nearCurrentPriceUSD())
        details["currentNearUSD"] = priceOfNear
    
        console.log()
    
        let fullyPrinted = true
    
        if(priceOfNear){
            console.log(`⚪ NEAR Value (USD):`)
            console.log(`   Ⓝ  1 = $${priceOfNear}`)
        } else {
            fullyPrinted = false
        }
    
        if(database){
            console.log(`💾 Number of Data(s): ${dbSize}`)
            const sKeys = Object.keys(statusCounter)
            for(let i = 0; i < sKeys.length; i++){
                console.log(`   👉 ${sKeys[i]} jobs: ${statusCounter[sKeys[i]]} (${await percentStr(statusCounter[sKeys[i]], dbSize, 2)})`)
            }
            console.log(`💸 Total NEAR Paid: Ⓝ  ${totalNearSpent}`)
            console.log(`💰 Total Project NEAR Cost (estimated): Ⓝ  ${totalCost}`)
        } else {
            fullyPrinted = false
        }
    
        console.log(`⌛ Average Complete Time: ${avgCompletedTime} millisecond(s)`)

        const scState = await manager.scGetAllData()
        if(scState.complete){
            console.log("📝 Smart Contract Bassic State:")
            console.log("   👉 Current Jobs & Their States: ")
            console.log(`       😊 Completed Jobs: ${scState.types.completed.length}`)
            console.log(`       😐 In_Progress Jobs: ${scState.types.in_progress.length}`)
            console.log(`       😔 Available Jobs: ${scState.types.available.length}`)
            console.log(`       🟡 Total Jobs: ${scState.all.length}`)

            const currentSetURL = await smartContract.getURL(config.smartContract.scAccount)
            const currentRequestFee = await smartContract.viewFunction(config.smartContract.mainAccount, config.smartContract.scAccount, "get_request_fee", {})

            if(currentRequestFee || currentSetURL){
                console.log(`   👉 Other Variables:`)
            }

            if(currentSetURL){
                console.log(`       🌐 Data Web API's URL: ${currentSetURL}`)
            } else {
                fullyPrinted = false
                logger.error(`${nameForLog} Failed to get current set URL from smart contract: ${JSON.stringify(currentSetURL)}`)
            }

            if(currentRequestFee){
                console.log(`       🎫 Current Request Fee: Ⓝ ${nearAPI.utils.format.formatNearAmount(currentRequestFee)}`)
            } else {
                fullyPrinted = false
                logger.error(`${nameForLog} Failed to get current request fee from smart contract: ${JSON.stringify(currentRequestFee)}`)
            }

        }else{
            fullyPrinted = false
        }

        if(!fullyPrinted){
            console.log("🛑 ERROR OCCURRED SO KEY INFORMATION(S) ARE MISSING; CHECK THE LOG(S)!")
            logger.error(`${nameForLog} Failed to fully display all the current information because some errors occurred`)
        }
    
        console.log()
    
        return details
    } catch(e) {
        logger.fatal(`${nameForLog} The following completely unexpected error occurred: ${e}`)
    }

    return undefined
}

// MAIN FUNCTION CALLS
displayState().then()
