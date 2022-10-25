const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require("fs")

const config = require("../../config/config.json")

const filename = path.basename(__filename)

test(`Test if logs are written to ${config.logfile}`, () => {
    if( !config.pausedTestFiles.includes(filename) ){
        const firstFileExists = fs.existsSync(config.logfile)

        if(firstFileExists){
            console.log(`Log file ${config.logfile} should not exist for this unit test`)
        }

        expect(firstFileExists).toBe(false)

        const logger = require("../logger")

        const uniqID = String(uuidv4())

        try {
            logger.debug(`Logger DEBUG Severity Test - Test ID ${uniqID}`)
            logger.info(`Logger INFO Severity Test - Test ID ${uniqID}`)
            logger.warn(`Logger WARN Severity Test - Test ID ${uniqID}`)
            logger.error(`Logger ERROR Severity Test - Test ID ${uniqID}`)
            logger.fatal(`Logger FATAL Severity Test - Test ID ${uniqID}`)
        } catch(err) {
            throw `Error occurred well trying to log : ${err}`
        }

        const secondFileExists = fs.existsSync(config.logfile)

        expect(secondFileExists).toBe(true)
    } else {
        console.log("Skipping this test because this test is on PAUSE at the moment. You can change this by modifying this project's config file(s).")
    }
})


