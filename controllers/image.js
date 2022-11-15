const moment = require("moment")
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const fs = require("fs");
const smartContract = require("../middlewares/db_manager/scTalker")
const db = require("../middlewares/database/db")
const logger = require("../utils/logger")

async function getImage(req, res) {
    const username = req.body.username
    const signature = Buffer.from(req.body.signature, "base64")

    if(!username || !signature){
        return res.status(400).send(`invalid, or lack of, valid header values were provided for this request`)
    }

    const imageID = String(req.body.id)
    const dbImageData = await db.getImageData({id: imageID})

    if(dbImageData.length === 0){
        return res.status(400).send(`${imageID} is an id that does not correlate to any data in the dataset`)
    }

    const filepath = dbImageData[0].filepath

    let scTestMode = false
    if(process.env.SCTEST){
        scTestMode = true
    }

    const smartContractData = await smartContract.getState(scTestMode)

    const scFoundEntries = smartContractData.filter(obj => obj.id === imageID)

    console.log(0)
    if(scFoundEntries.length > 0){
        console.log(1)
        const scEntry = scFoundEntries[0]
        if(scEntry.status !== "completed"){
            let labelers = {}
            for(let i = 0; i < scEntry.tasks.length; i++){
                let entry = scEntry.tasks[i]
                if(entry.type === "label"){
                    labelers[entry.assigned_to] = entry.public_key
                }
            }

            let userPubKey = labelers[username]

            if(userPubKey){
                try{
                    console.log(3)
                    let isVerified = crypto.verify(
                        "sha256",
                        Buffer.from(username),
                        {
                            key: userPubKey,
                            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                        },
                        signature
                    );
                    if(isVerified){
                        console.log(4)
                        // return res.status(200).send(`:) VALID!`)
                        if (fs.existsSync(filepath)){
                            return res.sendFile(filepath)
                        }
                    }
                } catch(err) {
                    console.log(err)
                }
            }
        }
    }

    return res.status(200).send(`INVALID!`)
}

module.exports = {
    getImage
}


