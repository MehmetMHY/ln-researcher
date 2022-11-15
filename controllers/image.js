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
                            console.log(5)
                            const realImg = fs.readFileSync(filepath)
                            const key = crypto.randomBytes(64).toString('hex')
                            let output = {
                                "image": CryptoJS.Rabbit.encrypt(realImg, key),
                                "encKey": crypto.publicEncrypt(
                                    {
                                        key: userPubKey,
                                        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                                        oaepHash: "sha256",
                                    },
                                    Buffer.from(key)
                                ).toString("base64")
                            }

                            output = CryptoJS.Rabbit.decrypt(output.image, key);

                            res.writeHead(200, { "Content-type": "application/json" });
                            res.write(JSON.stringify(output));
                            res.end();
                            return res

                            // // just testing
                            // x = JSON.stringify(output)
                            // y = JSON.parse(x).image
                            // z = CryptoJS.Rabbit.decrypt(y, key)
                            // res.writeHead(200, { "Content-type": "application/json" });
                            // res.write(JSON.stringify(z));
                            // res.end();
                            // return res.sendFile(filepath)

                            // return res.status(200).json(output)
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


