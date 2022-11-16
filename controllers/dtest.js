const crypto = require("crypto");
const axios = require("axios")
const db = require("../middlewares/database/db")
const scTestData = require("../middlewares/smart_contract/test/testSmartContractTestData.json")

async function apiResetDBEntryTool(){
    const filepath = "/Users/mehmet/Desktop/NEAR-DEV/content/img_data/plants_5-18-2019/corn_plants/img_0012.jpg"

    let before = await db.getImageData({filepath:filepath})
    console.log("BEFORE:")
    console.log(JSON.stringify(before, null, indent=4))

    console.log("\n\n")

    await db.editImageData(filepath, { usedSignatures: [] }, { filepath: filepath })

    let after = await db.getImageData({filepath:filepath})
    console.log("AFTER:")
    console.log(JSON.stringify(after, null, indent=4))
}

async function apiTestImageEndpoint() {
    const id = "26fc9ae1-4a56-483a-82d7-b7f40478042b"
    const username = "user25.near"
  
    const user = scTestData.testUsers[username]
    const publicKey = user.public
    const privateKey = user.private
  
    const verifiableData = username
  
    let signature = crypto.sign("sha256", Buffer.from(verifiableData), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    });
  
    signature = signature.toString("base64")
  
    const payload = {
      "id": id,
      "username": username,
      "signature": signature
    }
  
    const axiosConfig = {
        url: "http://localhost:3000/image/",
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

    if(response === undefined){
        return false
    }

    const result = response.data

    return true
  }

  apiResetDBEntryTool().then()
  