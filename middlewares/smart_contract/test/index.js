const crypto = require("crypto");
const db = require("../../database/db")
const moment = require("moment")
const fs = require('fs');
const logger = require("../../../utils/logger")

const testDataFileName = "testSmartContractTestData.json"

/*
CREDIT FOR NOUNS/NOUNS.JSON VARIABLE/FILE
- Date:     11-4-2022
- Sources:
    - https://gist.github.com/peterdemin/920ec3eaaa0a9f3cafd3a855557f5e0c
    - https://gist.github.com/pcgeek86/78f4cad29dd16961ceeeee654127a0db
    - https://gist.github.com/atduskgreg/3cf8ef48cb0d29cf151bedad81553a54
    - https://www.vocabulary.com/lists/189583#view=list
- About:    dataset of some common english nouns
*/
const nouns = require("./nouns.json").data

/*
CREDIT FOR GETRSAKEYS() FUNCTION
- Date:     11-4-2022
- Source:   https://www.geeksforgeeks.org/node-js-crypto-generatekeypair-method/
- About:    create a pair of RSA keys (public and private)
*/
async function getRSAKeys(){
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        namedCurve: 'secp256k1',
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'der'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'der'
        }
    });

    return {
        "obj": {
            public: publicKey,
            private: privateKey
        },
        "str": {
            public: publicKey.toString("hex"),
            private: privateKey.toString("hex")
        }
    }
}

// get the currect epoch time in seconds
async function currectEpoch(){
    return moment().unix() // seconds
}

/*
CREDIT FOR RANDOMNUMBER() FUNCTION
- Date:     11-5-2022
- Source:   https://stackoverflow.com/questions/17726753/get-a-random-number-between-0-0200-and-0-120-float-numbers
- User:     Alesanco
- About:    return a random number based on a set setting
*/
async function randomNumber(places, start, end){
    return parseFloat((Math.random() * (start - end) + end).toFixed(places))
}

// create object of image labels which consists of annotations and 2D coordinates
async function genPoints(numOfLabels, totalPointsRange, xRange, yRange){
    let minPoint = totalPointsRange[0]
    let maxPoint = totalPointsRange[1]

    let xMin = xRange[0]
    let xMax = xRange[1]

    let yMin = yRange[0]
    let yMax = yRange[1]

    let topics = []
    while(true){
        let randomIndex = Math.floor(Math.random()*nouns.length)
        let entry = nouns[randomIndex]

        if(!(entry in topics)){
            topics.push(entry)
        }

        if(topics.length === numOfLabels){
            break
        }
    }

    let output = {}
    for(let i = 0; i < topics.length; i++){
        output[topics[i]] = { "annotation": [], "points": [] }

        const numOfPoints = await randomNumber(0, minPoint, maxPoint)

        let annotation = ""
        for(let j = 0; j < (numOfPoints * 5); j++){
            annotation = annotation + nouns[Math.floor(Math.random()*nouns.length)] + " "
        }

        output[topics[i]]["annotation"] = annotation

        for(let j = 0; j < numOfPoints; j++){
            let x = await randomNumber(0, xMin, xMax)
            let y = await randomNumber(0, yMin, yMax)
            output[topics[i]]["points"].push([x,y])
        }
    }

    return output
}

/*
CREDIT FOR SHUFFLE() FUNCTION
- Date:     11-6-2022
- Source:   https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
- User:     coolaj86
- About:    shuffle/mix-up an array
*/
async function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}

// check if all the elements in an array are type number
function allNum(array){
    return array.every(index => { return typeof(index) === "number" })
}

// get the sum of all the numbers in an array
function addAll(array){
    let sum = 0
    array.forEach(function(item){
        sum += item
    })
    return sum
}

// round up (ceil) all the numbers in an array
function ceilAll(array){
    let output = []
    array.forEach(function(item){
        output.push(Math.ceil(item))
    })
    return output
}

/** 
 * Generate a json-file/database that would be the same/similar to what the smart contract would return. This is 'fake' data used for testing.
 * 
 * @param {array} jobCountRange - range of how many jobs you want to generate for this fake/testing smart contract data
 * @param {array} imageResolution - resolution of a image
 * @param {array} rewardRange - range of how much the reward should be for each entry in the fake/testing smart contract data
 * @param {array} imgLabelRange - range of how many label topics should be made per entry in the smart contract data
 * @param {array} pointRange - range of how many label (coordinates) should be made per entry in the smart contract data
 * @return {boolean/file} - true if no errors occurred or false if an error occurred. also a json file should be created if there are no issues.
 * 
 * EXAMPLE:
 *      genTestData([5,5], [3584,2240], [0.03, 0.06], [1, 4], [2, 5])
*/
async function genTestData(jobCountRange, imageResolution, rewardRange, imgLabelRange, pointRange){
    const filepath = `${__dirname}/${testDataFileName}`

    try{
        jobCountRange = ceilAll(jobCountRange)
        imageResolution = ceilAll(imageResolution)
        rewardRange = ceilAll(rewardRange)
        imgLabelRange = ceilAll(imgLabelRange)
        pointRange = ceilAll(pointRange)

        const conditions = [
            (Array.isArray(jobCountRange) && Array.isArray(imageResolution) && Array.isArray(rewardRange) && Array.isArray(imgLabelRange) && Array.isArray(pointRange)),
            (jobCountRange.length === 2 && imageResolution.length === 2 && rewardRange.length === 2 && imgLabelRange.length === 2 && pointRange.length === 2),
            (allNum(jobCountRange) && allNum(imageResolution) && allNum(rewardRange) && allNum(imgLabelRange) && allNum(pointRange)),
            (jobCountRange[0] <= jobCountRange[1] && rewardRange[0] <= rewardRange[1] && imgLabelRange[0] <= imgLabelRange[1] && pointRange[0] <= pointRange[1]),
            (addAll(jobCountRange) > 0 &&  addAll(imageResolution) > 0 && addAll(imgLabelRange) > 0 && addAll(pointRange) > 0)
        ]

        // make sure input is valid
        conditions.forEach(function(item, index){
            if(!item){
                logger.error(`Inputted params ${JSON.stringify(functionInputs)} is invalid because it failed condition number/index ${index}`)
                return false
            }
        })

        const inputSettings = {
            "jobCountRange": jobCountRange,
            "imageResolution": imageResolution,
            "rewardRange": rewardRange,
            "imgLabelRange": imgLabelRange,
            "pointRange": pointRange
        }

        logger.info(`Creating the researcher's smart contract test data to ${filepath} with the following settings: ${JSON.stringify(inputSettings)}`)

        // important, hard set, variables. double check theses variables
        const statusOptions = ["waiting", "pending", "completed"]
        const uniqUserCountTotal = 3 * 2
        const oneMonthSeconds = 30 * 24 * 60 * 60

        const currectTime = await currectEpoch()
    
        const currectDB = await db.getImageData()
        const ids = currectDB.map(obj => obj.id)
    
        const width = imageResolution[0]
        const height = imageResolution[1]
    
        const jobs = await randomNumber(0, jobCountRange[0], jobCountRange[1])
    
        let statusDivide = Math.floor(jobs/(statusOptions.length))
        let waitings = statusDivide
        let pendings = statusDivide
        let completes = jobs-(2*statusDivide)
    
        let allFakeData = []
        let userTable = {}
        let userCounter = 0
        for(let i = 0; i < jobs; i++){
            let entry = {
                id: ids[i],
                status: "",
                reward: await randomNumber(4, rewardRange[0], rewardRange[1]),
                expires: currectTime + oneMonthSeconds,
                ranking: [],
                tasks: []
            }
    
            let lUsers = []
            let rUsers = []
            for(let j = 0; j < uniqUserCountTotal; j++){
                if(j < Math.floor((uniqUserCountTotal/2))){
                    lUsers.push(`user${userCounter}.near`)
                } else {
                    rUsers.push(`user${userCounter}.near`)
                }
                userCounter += 1
            }
    
            entry["ranking"] = await shuffle(lUsers)

            const numOfLabelTopics = await randomNumber(0, imgLabelRange[0], imgLabelRange[1])
    
            for(let j = 0; j < lUsers.length; j++){
                let tmpKeys = await getRSAKeys()
                userTable[lUsers[j]] = tmpKeys.str
                entry.tasks.push({
                    type: "label",
                    assigned_to: rUsers[j],
                    public_key: tmpKeys.str.public,
                    data: await genPoints(numOfLabelTopics, [pointRange[0], pointRange[1]], [0, width], [0, height]),
                    "timed-assigned": await randomNumber(2, currectTime, currectTime + (60*5)),
                    "time-submitted": await randomNumber(2, currectTime + (60*5), currectTime + (2*60*5))
                })
            }
    
            for(let j = 0; j < rUsers.length; j++){
                let tmpKeys = await getRSAKeys()
                userTable[rUsers[j]] = tmpKeys.str
                entry.tasks.push({
                    type: "review",
                    asigned_to: rUsers[j],
                    public_key: tmpKeys.str.public,
                    data: await shuffle(lUsers),
                    "timed-assigned": await randomNumber(2, currectTime, currectTime + (60*5)),
                    "time-submitted": await randomNumber(2, currectTime + (60*5), currectTime + (2*60*5))
                })
            }
    
            // add to the final output
            const coinFilp = await randomNumber(0, 0, 1)
    
            if(waitings > 0){
                entry.tasks = []
                entry.ranking = []
                entry.status = statusOptions[0]
                waitings -= 1
            } 
            else if(pendings > 0){
                entry.tasks = entry.tasks.slice(0, await randomNumber(0, 1, 2))
                entry.ranking = []
                entry.status = statusOptions[1]
                pendings -= 1
            }
            else{
                entry.status = statusOptions[2]
                completes -= 1
            }
    
            allFakeData.push(entry)
        }
    
        const fileOutput = {
            "created": currectTime,
            "aboutFunction": {
                "functionName": genTestData.name,
                "input": inputSettings
            },
            "output": allFakeData,
            "testUsers": userTable
        }

        fs.writeFile(filepath, JSON.stringify(fileOutput, null, indent=4), 'utf8', function(err){
            if(err){
                logger.fatal(err)
            } else {
                logger.info(`Successfully created the reseacher's smart contract test data to ${filepath}`)
            }
        })

        return true
    
    }catch(e){
        logger.fatal(`The following unexpected error occurred: ${e}`)
    }

    logger.error(`Failed to create researcher's smart contract test data to ${filepath}`)

    return false
}

async function getTestData(){
    const filepath = `${__dirname}/${testDataFileName}`
    if(fs.existsSync(filepath)){
        return require(filepath)
    } else {
        return undefined
    }
}

module.exports = {
    genTestData,
    getTestData
}

genTestData([5,5], [3584,2240], [0.03, 0.06], [1, 4], [2, 5]).then()