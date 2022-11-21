const crypto = require("crypto")
const db = require("../../database/db")
const moment = require("moment")
const fs = require('fs');
const logger = require("../../../utils/logger")

const testDataFileName = "testSmartContractTestData.json"

/*
CREDIT - A json dataset of some common english nouns
This dataset was built from various sources:
    - 11-4-2022 : https://gist.github.com/peterdemin/920ec3eaaa0a9f3cafd3a855557f5e0c
    - 11-4-2022 : https://gist.github.com/pcgeek86/78f4cad29dd16961ceeeee654127a0db
    - 11-4-2022 : https://gist.github.com/atduskgreg/3cf8ef48cb0d29cf151bedad81553a54
    - 11-4-2022 : https://www.vocabulary.com/lists/189583#view=list
*/
const nouns = require("./nouns.json").data

/*
CREDIT - A function that generates and returns a RSA key pair (public & private keys):
This function was taken directly and modified from GeeksForGeeks' online article:
    - 11-4-2022 : https://www.geeksforgeeks.org/node-js-crypto-generatekeypair-method/
*/
async function getRSAKeys(){
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
    })

    return {
        public: publicKey.export({ type: "pkcs1", format: "pem" }),
        private: privateKey.export({ type: "pkcs1", format: "pem" })
    }
}

// get the currect epoch time in seconds
async function currectEpoch(){
    return moment().unix() // seconds
}

/*
CREDIT - A function that creates a random number in a defined range
This one-line function body was taken directly from Alesanco Stackoverflow post:
    - 11-5-2022 : https://stackoverflow.com/questions/17726753/get-a-random-number-between-0-0200-and-0-120-float-numbers
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
CREDIT - Shuffle an array
This function was taken directory from coolaj86's Stackoverflow post:
    - 11-6-2022 : https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
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

    let rewardRangeBackup = rewardRange

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

    rewardRange = rewardRangeBackup

    const inputSettings = {
        "jobCountRange": jobCountRange,
        "imageResolution": imageResolution,
        "rewardRange": rewardRange,
        "imgLabelRange": imgLabelRange,
        "pointRange": pointRange
    }

    logger.info(`Creating the researcher's smart contract test data to ${filepath} with the following settings: ${JSON.stringify(inputSettings)}`)

    // important, hard set, variables. double check theses variables
    const statusOptions = [ "available", "in_progress", "completed" ]
    const uniqUserCountTotal = 3 * 2

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
            tasks: []
        }

        entry["reward"] = await randomNumber(4, rewardRange[0]*Math.pow(10,24), rewardRange[1]*Math.pow(10,24)) // in yNear
        entry["reward"] = entry["reward"].toLocaleString('fullwide', {useGrouping:false})

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

        entry["final_ranking"] = await shuffle(lUsers)

        const numOfLabelTopics = await randomNumber(0, imgLabelRange[0], imgLabelRange[1])

        entry["expires"] = (currectTime + (60*60)) * Math.pow(10,9)
        entry["expires"] = entry["expires"].toLocaleString('fullwide', {useGrouping:false})

        for(let j = 0; j < lUsers.length; j++){
            let tmpKeys = await getRSAKeys()
            userTable[lUsers[j]] = tmpKeys
            let started = (await randomNumber(2, currectTime, currectTime + (60*5))) * Math.pow(10, 9)
            let ended = (await randomNumber(2, currectTime + (60*5), currectTime + (2*60*5))) * Math.pow(10, 9)
            entry.tasks.push({
                type: "label",
                assigned_to: lUsers[j],
                public_key: tmpKeys.public,
                data: await genPoints(numOfLabelTopics, [pointRange[0], pointRange[1]], [0, width], [0, height]),
                "time_assigned": started.toLocaleString('fullwide', {useGrouping:false}),
                "time_submitted": ended.toLocaleString('fullwide', {useGrouping:false})
            })
        }

        for(let j = 0; j < rUsers.length; j++){
            let tmpKeys = await getRSAKeys()
            userTable[rUsers[j]] = tmpKeys
            let started = (await randomNumber(2, currectTime, currectTime + (60*5))) * Math.pow(10, 9)
            let ended = (await randomNumber(2, currectTime + (60*5), currectTime + (2*60*5))) * Math.pow(10, 9)
            entry.tasks.push({
                type: "review",
                assigned_to: rUsers[j],
                public_key: tmpKeys.public,
                data: await shuffle(lUsers),
                "time_assigned": started.toLocaleString('fullwide', {useGrouping:false}),
                "time_submitted": ended.toLocaleString('fullwide', {useGrouping:false})
            })
        }

        // add to the final output
        const coinFilp = await randomNumber(0, 0, 1)

        if(waitings > 0){
            entry.tasks = []
            entry.final_ranking = []
            entry.status = statusOptions[0]
            waitings -= 1
        } 
        else if(pendings > 0){
            entry.tasks = entry.tasks.slice(0, await randomNumber(0, 1, 2))
            entry.final_ranking = []
            entry.status = statusOptions[1]
            pendings -= 1
        }
        else{
            entry.status = statusOptions[2]
            completes -= 1
        }

        allFakeData.push(entry)
    }

    const finalAllFakeData = {}
    statusOptions.forEach(function(element){
        finalAllFakeData[element] = allFakeData.filter(obj => obj.status === element)
    })

    const fileOutput = {
        "metadata": {
            "function": genTestData.name,
            "input": inputSettings,
            "filepath": filepath,
            "created": currectTime
        },
        "output": finalAllFakeData,
        "testUsers": userTable,
    }

    fs.writeFile(filepath, JSON.stringify(fileOutput, null, indent=4), 'utf8', function(err){
        if(err){
            logger.fatal(err)
        } else {
            logger.info(`Successfully created the reseacher's smart contract test data to ${filepath}`)
        }
    })

    return fileOutput
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
    getTestData,
    getRSAKeys
}
