const crypto = require("crypto")
const axios = require("axios")
const fileCryt = require("./cryptography")
const fs = require("fs")

async function main(){
    const username = "user25.near"

    const keys = {
        "user25.near": {
            "public": "-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEA1szCgh18rZ6e9U03uaZMJOBhQLet0gE7iSPf9YqTg5lK6kXqJDVW\nmwg/0ThHX0daTD5KEsAW3BdTeJudOLHG4LuAaiDhY5A+2yqh9nhJrVP9t83n5zBA\nCXWLda1HvwDg32U02H84USf4kTQ+5caGbM3URQRlmYFQB+lTYINoFfF+v9HVrZsK\nHWd7A7X8W8aQZVpatuANcUhoQoewdpNRkpDqCdlGG9xEQAc0wUrKU4LUITnEOJL+\n8ShSr9AMe3141syPdG8jgtdesmYIKC8v3diaR7vxp6e8pgSeD/NVXcG7OYqyt2or\nU1SrN2o84liKMMsP9/7xj8UwPWKDQ0s2xQIDAQAB\n-----END RSA PUBLIC KEY-----\n",
            "private": "-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEA1szCgh18rZ6e9U03uaZMJOBhQLet0gE7iSPf9YqTg5lK6kXq\nJDVWmwg/0ThHX0daTD5KEsAW3BdTeJudOLHG4LuAaiDhY5A+2yqh9nhJrVP9t83n\n5zBACXWLda1HvwDg32U02H84USf4kTQ+5caGbM3URQRlmYFQB+lTYINoFfF+v9HV\nrZsKHWd7A7X8W8aQZVpatuANcUhoQoewdpNRkpDqCdlGG9xEQAc0wUrKU4LUITnE\nOJL+8ShSr9AMe3141syPdG8jgtdesmYIKC8v3diaR7vxp6e8pgSeD/NVXcG7OYqy\nt2orU1SrN2o84liKMMsP9/7xj8UwPWKDQ0s2xQIDAQABAoH/MyhF37dTTTOQmSbh\ncYptegCNKQJZxXWjzuAPQifGcrba7A726XuOWYs7iaA/m5c9LgmJqc9wVwnNwOQ/\n74SFwpblfp10PdFCkIa8daQhUWpcvzU0Z/HhMF+KorDmEq4bWPsUdU5P15riJ3bJ\n/JU1BVp4pKwUlZFNSYYEt2iypTuFvQNudIOYw2j5140IQSixTwxFkiQobAdDXPsI\nhpnb48c2l08AIW93C3vbV1HtfE5mS1987owXKzc0NnWe74sAwExEeOmgz5m11Nyc\n7WqQ9N2PBfU2pInXhGEVTsvrfonR6F24vTFu49NAIQKmQTZUg0Tdldwo/5IQNYQD\nORVxAoGBAO7AoGM3NuWUy5tRQBbgyjlq7SrN8rHC0P7smloW8wLoc1e3I0Fsz7GJ\nGllkfDwlWT2sJaW7HFZ83cOIr8Ua43Dmlwt3hSBnLNqnENfod5jkxssbu94W8KWN\ncmKmN6uARjybSpOYdRIIGL/95v1rljUTfkC23clqA1PiSlGIEcqdAoGBAOZRKlAE\nRBBZ5nJV+bJuNEG/3nZLt0u7g/ir90fl6oQs75IB+ortrpBzd1WdRLh9c00M8PkG\n4t4B4v09CgILUkrfA+q15Ah3sjTspq38KtW/UJpp7I8BhIXh7HRMed+4u7/s3/7R\ng9/Ep2KWZS6LOOZC62QOidXg/b4pPgpStzBJAoGBALjW5NUrQBMJ2YALrWSI78b4\nI1lKTKSWwRs7rlwk/Eq6D+JO5LqYNUura3zdsNkXyTlX92WRsOS8kyv4vKwKnx8f\nRr0X8Tce6bj2MrIVRdJW/BjvBclxVSm2kmIRcXQTQU1WpKwUEj69ifvJ5HU6P/Yj\ne1E6wgZXTvA4d3UbtTp5AoGAHHARJWghb1NqXNu4xQtOcH/cXAblTviMRvwUwE/n\nMQLLYd/Uq6rFTxiyt2N/xLfYsL7UUitDf94DxPjwb2gudQgsV6K10UXWPyqpOfpU\n36eLsEU77DxnvJA0vfdjZPhOVlhNIA2Glu6VLFsdiy2tjODeZ7BT3JC3Q++btXKZ\nI+ECgYEAlP3mpjqSOksTjmm/nSKHSgLkWOlibab2g8h9oGKsmOITiQ/Y8WaLJgi1\nk1tLX5zFtz/XxhsctcutyZ14NH2bmi2TmhMmK8emSBCXmcf7endXE4vpqbdpBEqC\nKqatpHaCW5tlFMqRLDjzj6NWAkmJwpeqVuXgCfl53UQaEZJRJ1E=\n-----END RSA PRIVATE KEY-----\n"
        }
    }

    const publicKey = keys[username]["public"]
    const privateKey = keys[username]["private"]

    const payload = {
        "id": "41dd387e-2deb-4a1e-93d4-34bc42e5fea9",
        "username": "user25.near",
        "signature": "YG+oJViNQA20Miyxoxi7HUqF0h6DPGZ3yhy1AymE30cZ1FnSIzpj6fKGiymgN9hI6NJXqmbN7lNWt8rb64ICvv/j/t262br8vYj+SGWDGST0vbFESFcn+E23tp4MAzT18cap/YlRW9XDrsZ71HsY83mWHjHhFeoKtr0AFyQrglF0cmUg2Fq5pRstVZ6MFE6n2d53WLSczAQxpeCpU7tbPHadQ7Lh7VfLqO4NvzolSV4VMg2gLhxvsLgzLyvaSLC7cjUas20fempiVh/Pz2iYm33047qYphYiGFuR5yCJD6a4DidtrELL87gTu2qNqV2Zh6Ai31Z90tEtfowvO3oYLQ=="
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

        fs.writeFileSync("./meme.jpg", dImage)
    }

    return
}

main().then()




// async function apiTestImageEndpoint() {
//     const id = "26fc9ae1-4a56-483a-82d7-b7f40478042b"
//     const username = "user25.near"
  
//     const user = scTestData.testUsers[username]
//     const publicKey = user.public
//     const privateKey = user.private
  
//     const verifiableData = username
  
//     let signature = crypto.sign("sha256", Buffer.from(verifiableData), {
//       key: privateKey,
//       padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
//     });
  
//     signature = signature.toString("base64")
  
//     const payload = {
//       "id": id,
//       "username": username,
//       "signature": signature
//     }
  
//     const axiosConfig = {
//         url: "http://localhost:3000/image/",
//         method: "post",
//         data: payload,
//         headers: Object.assign({"Content-Type": "application/json"}, {})
//     }

//     let response = undefined
  
//     try {
//         response = await axios.request(axiosConfig)
//     } catch(err) {
//         console.log(err)
//     }

//     if(response === undefined){
//         return false
//     }

//     const result = response.data

//     return true
//   }