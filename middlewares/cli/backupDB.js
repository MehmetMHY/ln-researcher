const moment = require("moment")
const fs = require("fs")
const db = require("../database/db")
const path = require('path');
const logger =require("../../utils/logger")

const nameForLog = `[cli_backupDB]`

async function main(){
    let args = (process.argv)

    if(args.length <= 2){
        logger.error(`${nameForLog} Failed to backup local db due to directory not being provided in argument(s): ${JSON.stringify(args)}`)
        return 1
    }

    args = args.splice(2, process.argv.length)
    const fileOutDirPath = args[0]
    
    if(!fs.existsSync(fileOutDirPath)){
        logger.error(`${nameForLog} Failed to backup local db due to directory ${fileOutDirPath} not existing`)
        return 1
    }

    const database = await db.getImageData()
    
    const data = JSON.stringify(database, null, indent=4)
    const finalFilePath = path.join(fileOutDirPath, `dbBackup_${moment().valueOf()}.json`);
    
    fs.writeFileSync(finalFilePath, data)

    logger.info(`${nameForLog} Created db backup file (json) to ${finalFilePath}`)

    return 0
}

// MAIN FUNCTION CALLS
main().then(result=>console.log(JSON.stringify(result)))

