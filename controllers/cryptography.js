const crypto = require("crypto");

const axios = require("axios")

const scTestData = require("../middlewares/smart_contract/test/testSmartContractTestData.json")

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

  console.log(JSON.stringify(axiosConfig, null, indent=4))

  try {
      const response = await axios.request(axiosConfig)
      return response.data
  } catch(err) {
      console.log(err)
      return false
  }
}

apiTestImageEndpoint().then(result=>console.log(result))
