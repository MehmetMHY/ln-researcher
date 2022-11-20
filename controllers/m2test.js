const moment = require("moment")
const crypto = require("crypto")
const axios = require("axios")
const fileCryt = require("./cryptography")
const fs = require("fs")

const scTestData = require("../middlewares/smart_contract/test/testSmartContractTestData.json")

async function main(){
    const id = "41dd387e-2deb-4a1e-93d4-34bc42e5fea9"
    const username = "user25.near"

    const url = "http://localhost:3000/image/"
    const finalImgFilePath = `./img_${moment().unix()}.jpg`
    const publicKey = scTestData["testUsers"][username]["public"]
    const privateKey = scTestData["testUsers"][username]["private"]

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
    }

    return
}

main().then()

