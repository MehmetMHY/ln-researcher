const moment = require("moment")
const crypto = require("crypto")
const axios = require("axios")
const fileCryt = require("../cryptography")
const fs = require("fs")

const scTestData = require("./mkeys.json")

async function main(){
    const id = "4615dfd3-98c6-40b3-971f-073449f05faa"
    const username = "memetime.testnet"

    const url = "http://localhost:3000/image/"
    const finalImgFilePath = `./img_${moment().unix()}.jpg`
    const publicKey = scTestData["public"]
    const privateKey = scTestData["private"]

    let signature = crypto.sign("sha256", Buffer.from(username), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    })
    signature = signature.toString("base64")

    const payload = {
        "id": id,
        "username": username,
        "signature": signature
    }

    const axiosConfig = {
        url: url,
        method: "post",
        data: payload,
        headers: Object.assign({"Content-Type": "application/json"}, {})
    }

    let response = undefined
    try {
        response = await axios.request(axiosConfig)
    } catch(err) {
        console.log(err)
    }

    if(response){
        const description = response.headers.description
        const imageKey = response.headers.imagekey
        const eImage = response.data

        const key = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(imageKey, "base64")
        ).toString("base64")

        const dImage = await fileCryt.decrypt(Buffer.from(eImage, "base64"), key)

        fs.writeFileSync(finalImgFilePath, dImage)
        
        // print data stored in the header
        console.log("IMAGEKEY:")
        console.log("---------")
        console.log(`${imageKey} \n`)
        console.log("DESCRIPTION:")
        console.log("------------")
        console.log(`${description} \n`)
    }

    return
}

main().then()

