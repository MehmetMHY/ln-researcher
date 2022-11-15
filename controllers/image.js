const moment = require("moment")
const crypto = require("crypto");
const fs = require("fs");
const smartContract = require("../middlewares/db_manager/scTalker")
const db = require("../middlewares/database/db")
const logger = require("../utils/logger")
const util = require("../utils/util")
const config = require("../config/config.json")

const payloadSchema = require("../models/apiImagePayload").imgEndpoint

const nameForLog = `[SUPPLY-IMAGE]`

async function getImage(req, res) {
    const username = req.body.username
    const signature = req.body.signature

    logger.info(`${nameForLog} [http v${req.httpVersion}] ${req.method} request was made to endpoint ${req.originalUrl} with header(s) ${JSON.stringify(req.rawHeaders)} and payload/body ${JSON.stringify(req.body)}`)

    const validPayloadFormat = await util.schemaValidate(payloadSchema, req.body)
    if(!validPayloadFormat){
        logger.info(`${nameForLog} Request failed for payload ${JSON.stringify(req.body)} because it was not formated correctly`)
        return res.status(400).send(`request's payload is invalid or not formated correctly`)
    }

    const dataID = String(req.body.id)
    const dbImageData = await db.getImageData({id: dataID})

    if(dbImageData.length === 0){
        logger.info(`${nameForLog} Request failed for payload ${JSON.stringify(req.body)} because the payload's ID does not exist in the local database`)
        return res.status(400).send(`${dataID} is an id that does not correlate to any data in the dataset`)
    }

    const filepath = dbImageData[0].filepath

    let scTestMode = false
    if(process.env.SCTEST){
        scTestMode = true
    }

    const smartContractData = await smartContract.getState(scTestMode)

    const scFoundEntries = smartContractData.filter(obj => obj.id === dataID)

    if(scFoundEntries.length === 0){
        logger.info(`${nameForLog} Request failed for payload ${JSON.stringify(req.body)} because the payload's ID is not in the smart contract`)
        return res.status(400).send(`ID ${dataID} is not in the smart contract`)
    }

    const scEntry = scFoundEntries[0]
    if(scEntry.status === "completed"){
        logger.info(`${nameForLog} Request failed for payload ${JSON.stringify(req.body)} because the job for ${dataID} has already been completed`)
        return res.status(400).send(`The job for ${dataID} has already been completed`)
    }

    let labelers = {}
    for(let i = 0; i < scEntry.tasks.length; i++){
        let entry = scEntry.tasks[i]
        if(entry.type === "label"){
            labelers[entry.assigned_to] = entry.public_key
        }
    }

    let userPubKey = labelers[username]
    if(!userPubKey){
        logger.info(`${nameForLog} Request failed for payload ${JSON.stringify(req.body)} because ${username} does not have a stored public key in the smart contract`)
        return res.status(400).send(`Username ${username} does not have a stored public key in the smart contract`)
    }

    let isVerified = false;

    try{
        isVerified = crypto.verify(
            "sha256",
            Buffer.from(username),
            {
                key: userPubKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            },
            Buffer.from(signature, "base64")
        );
    } catch(err) {
        logger.error(`${nameForLog} Failed to use crpyto.verify() with payload ${JSON.stringify(req.body)} and public key ${userPubKey}. Resulting in this unexpected error: ${err}`)
    }

    if(!isVerified){
        logger.info(`${nameForLog} Request failed for payload ${JSON.stringify(req.body)} because the provided signature was invalid`)
        return res.status(403).send(`The provide signature is not valid for ${username}`)
    }

    let usedSignatures = dbImageData[0]["usedSignatures"]
    if(usedSignatures.includes(signature)){
        logger.info(`${nameForLog} Request failed for payload ${JSON.stringify(req.body)} because the data was sent out for user ${username} before and there for is no longer available`)
        return res.status(410).send(`ID ${dataID} was sent out for user ${username} before and there for is no longer available`)
    }

    if (!fs.existsSync(filepath) || !fs.existsSync(config.labelDescriptionPath)){
        logger.fatal(`${nameForLog} Request failed for payload ${JSON.stringify(req.body)} because the file ${filepath} and/or ${config.labelDescriptionPath} does not exist. The admin(s) MOST address this.`)
        return res.status(500).send(`The 'physical' data for ID ${dataID} does not exist in the server`)
    } 

    const description = fs.readFileSync(config.labelDescriptionPath, 'utf8');

    usedSignatures.push(signature)
    let dbOut = await db.editImageData(filepath, { usedSignatures: usedSignatures }, { filepath: filepath })
    logger.info(`${nameForLog} added a new signature to the local db: ${JSON.stringify(dbOut)}`)

    logger.info(`${nameForLog} File ${filepath} was sent out to requester with payload: ${req.body}`)
    return res.sendFile(filepath, { 
        headers: {
            description: description
        },
        lastModified: false
    })
}

module.exports = {
    getImage
}
