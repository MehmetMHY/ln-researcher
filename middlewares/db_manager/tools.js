const path = require('path');
const fs = require('fs');
const db = require("../database/db")
const logger = require("../../utils/logger")
const { v4: uuidv4 } = require('uuid');
const moment = require("moment")

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
        fails: [],
        new: [],
        exists: [],
        total: files.length,
        runtime: {
            time: 0,
            units: "seconds"
        },
        dir: dirPath
    }

    if(files){
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
                logger.error(`Failed to add file the following file to the database: ${fullPath}`)
                stats.fails.push(fullPath)
            }
        }

        const processTime = (moment().valueOf() - startTime) / 1000 // seconds

        stats.runtime.time = processTime

        logger.info(`For dir ${dirPath}, ${files.length} files were scanned. ${stats.new.length} new files were added, ${stats.exists.length} files already existed in the db, & ${stats.fails.length} files failed to get added. Full stats: ${JSON.stringify(stats)}`)
    }

    return stats
}

// addAllToDB().then(result=>console.log(JSON.stringify(result)))

// db.getImageData().then(result=>console.log(
//     JSON.stringify(result, null, indent=4)
// )).then()

// db.getImageData().then(result=>console.log(
//     "LENGTH:", result.length
// )).then()
