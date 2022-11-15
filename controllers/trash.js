const crypto = require("crypto");

const axios = require("axios")

// https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string/
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}
function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

async function get() {
  const smartContract = require("../middlewares/db_manager/scTalker")
  let username = "user29.near"

  const user = {
      "user29.near": {
        "public": "-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAycwymTN0dwe0SfvomoA94XCM8jaN7lraW/O3YA5PkpId0MaPWO/h\nE6TixfoHHicPba53H7dKJfUqehFIF85zSuK4ZtsWaYOe6tlya0z/wYk71Ceyb05t\nKrc5hM7DuDmqNtYu+8oKYOVBuK4Mt7mvwnN4GWWv+CepwR6PMZQesAnJqHTS8EQK\nh6TyiiF7vMuQijfFUQtkZjAWvWZ7w9u0pPFx9lzD8m0JM6MPHGnP7H6LUHYKcDDz\n4fbHED26TK++QGV7IvDUBCtKJgy/y8deVMpXDZVwZS1Fghd5UjbZ6W0OsGj6ofro\nM80tGz6IkufNwu0Rv7H4XPEjb0e46FWLvQIDAQAB\n-----END RSA PUBLIC KEY-----\n",
        "private": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAycwymTN0dwe0SfvomoA94XCM8jaN7lraW/O3YA5PkpId0MaP\nWO/hE6TixfoHHicPba53H7dKJfUqehFIF85zSuK4ZtsWaYOe6tlya0z/wYk71Cey\nb05tKrc5hM7DuDmqNtYu+8oKYOVBuK4Mt7mvwnN4GWWv+CepwR6PMZQesAnJqHTS\n8EQKh6TyiiF7vMuQijfFUQtkZjAWvWZ7w9u0pPFx9lzD8m0JM6MPHGnP7H6LUHYK\ncDDz4fbHED26TK++QGV7IvDUBCtKJgy/y8deVMpXDZVwZS1Fghd5UjbZ6W0OsGj6\nofroM80tGz6IkufNwu0Rv7H4XPEjb0e46FWLvQIDAQABAoIBAFrEVEYAlPQtLPTS\nMA++exb57wvLag+6IdmWR/cWuMfunSaZCUUxsIWLds0h5y2y2Ae3n7FOWjW0jsSV\nHV5H6CfYzqTFCtGu+D4eTI7i9W7x8U0+Bc528jdybpbEAdjNZzh/Imbyu7RVqjgN\nYX8KMHpAQdb6nCn8fSh2PGZKf3siPzKH/znC/mpsaj+3rhn8qs3NK57Rws2hy3Vd\nGUC03rRvW8V6JT0/CGw2RL/867ZjR7P/E2xUOp467UXa4Yw3nXXUmxqkdPG38ysI\nYdHKAt7aNtu3QmaPFZsSDTNZmLPYgWhyIAuPIG/xadaPHGH7wHW/xsU9tYg+mA/I\nco3GdqkCgYEA7p4DjYGOmejdJ19Iy7mQQnOujN6rvjeP4+LiMLgLwhKUcWoas89r\n9rWZqbBDCg0YpTZflaRuMYTQyjWqVcMM/R312oVmfE//d1wsMWX/C7+bINeQ+WBy\n4m9/eZ5wScQOj1XUg3SQ/kVFEmkrRMbx+3vsb+IUQjz0g5KnfVRDtisCgYEA2H+I\nemje8zRfFpCGRhUqw1Lth+Rja+W9oSLNHZN6xpCkqhQMeUsSZFLeeCTWccdMfMQR\n+ugBb3DZQZxFsIRYdAENbte63/YPm866HIsF2tWLSWd7pjGmAwnpixwwwYfSplJD\nqUWiFbWdeEv5AyPl0iAYF9f8ABl0fAbLC0p8ebcCgYA18NR+xZ3V3xU3VEvheeZJ\nj1sTDzclveuyKVTWjJRj381cwg6dPTN7xtugx26wM/uxRVRgQJaEbTDBtVX3Iyup\ngH9WUbe0PGVUtypqVFNOdZb82p40MYBm/auEc7OQiVh9QHrU6KHqSQBvRAT6/Dox\njncJZ8MKojroD1v7cfQIlwKBgDo2oKX5iOlwTZktp00059i5dbEykiEzFzg6uViY\njUzTG9O3rFr4+qsLNVKs5RSW+FQcDJGgzLIAcAqaUIrUK0yV89y4GUGbUjsc7SI7\np4leHiPQtYjMlM0AX1HOdLW1JckfGZ5sYNbhjMQJ+Z0EjAliI9hVdSc5sP6gfPw+\nPRYlAoGBAJYJAPGx9MfG0qVlJ5P2Su3qLkhC1JrDjulsXjW6LQakiV9it7xY8LqM\n8owKD7VTl9I81bF8yMjsPMUJODSd/dsJG9vac71YFxMHgQ+UqAZiNAU53Sf6zH4C\n57RL6Svd1BnDr4sAAUBz9vskVA+WTSoQ9FTe5CDp+2B+1Va8048T\n-----END RSA PRIVATE KEY-----\n"
    }
  }

  // const user = {
  //   "user0.near": {
  //       "public": "-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAvWL1N2RSFNcU9IzLwPPnnP+oQ8QEYkEfQBND9fsOVPbf7lx7qdre\nfMwdfprwLKaQmjXEDRpshQAk/niDiRZIyNEkSvTMdcnnQsSutObBv+4qF6k94tWa\ntoa+uaR0QXekb1z9U8RDqx4epEXGXPyHmqXzL40oLrGfM0FcovecOPY3QIdpU6CB\n6ud5TKAFwlK9mVLqrz+C+geixrAVuBv1V8pc3ztlBd0Wp1A6QeSDwhbAyihmKRmJ\n0d0Lad2rDvklOEpiKCQ1ZesqUtLY1YjUs4VjB+FPE1srn7463h+S0YrvJ+E04H/U\nnVykRREuK09sTVaLbF7fC+ueWKrvfNrRiwIDAQAB\n-----END RSA PUBLIC KEY-----\n",
  //       "private": "-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEAvWL1N2RSFNcU9IzLwPPnnP+oQ8QEYkEfQBND9fsOVPbf7lx7\nqdrefMwdfprwLKaQmjXEDRpshQAk/niDiRZIyNEkSvTMdcnnQsSutObBv+4qF6k9\n4tWatoa+uaR0QXekb1z9U8RDqx4epEXGXPyHmqXzL40oLrGfM0FcovecOPY3QIdp\nU6CB6ud5TKAFwlK9mVLqrz+C+geixrAVuBv1V8pc3ztlBd0Wp1A6QeSDwhbAyihm\nKRmJ0d0Lad2rDvklOEpiKCQ1ZesqUtLY1YjUs4VjB+FPE1srn7463h+S0YrvJ+E0\n4H/UnVykRREuK09sTVaLbF7fC+ueWKrvfNrRiwIDAQABAoIBABMuqMO5h47Q0jCK\n6kBa9AS06GgkvITvL6kfymxpx2PXtYrBF012+74MNpiSPO1o2ZClDXx+RquZ/iVA\nM6J4/VpJxLFK5kKv9pqOrVtpXAqCpwTKgZguJoOCVmMbQyM2aRNWidooMOpuHJBq\n+NKGSX3ifSU92OoR15wrbKSdC9fA++6aIgbgK5bb0W8lQEzHvGZvXhlq1S9vQMNo\ndFN7JloGQdszSirf5VLTCxUzjyxa7Q5+jRQfVyFhBmx65xlHeFaKlWF7VtCwEOvQ\nz8IaPT7Q6e8PzVgMeJFxOupaKAaOL/vXTyTCTREaUCVgwlQjQ07pNi4JyLDgn2Py\nCachWpECgYEA190Z8Hpsi7muVCEwEeahb0SbiuN+ypPXqUZs8Y0da39LmUI78nLX\nkXtZYdMKwV7omTznNzwTvTTJi0CGBjRG5MF6WuPXhj1Kl83MJPk+5gl59lJl6MmW\n5KiCNwEk/kyKG8tnRrYex3O1tjQUH0Zs8Be28enjgu364bxSnmync68CgYEA4JmS\nURY03ozg5TC7o98Vw1VD4zKwCWCKNgYdqmEpMt99nJsGfazH9iRQZh1MNVEgrdxA\nqOwUtuluNw9MPqXW07VA87/9sJ+HwENlvscnokNgUVP/bu7CK73bM3g0GxY74z/P\ngi23mZC5UPYI3uIzauzeQ//mPHerxU4AUy2MiuUCgYAQHPT+umS32Vhl90Q7Udfj\nEl/58hlYzchfXl5reXkkuQ/PlN4cru3gcjCt2K8I2CjMp3sq6FUg3nvc5Sgb9nME\nSFz1w+QmpRSYWEhQyjojublc5bGtur6Euv9dU7yLLvNwN7Kx2I5bnQuHWkPWQc+H\n7H0/eZH+B/2eNAyGvt2RCQKBgH2zlZ9KRWa1A/1hy/LIHT8IjokuyjVFUbUwsRO1\nc0BkssGeRgC6XeOVqWWtSgShFiAYIBwqnOFOPgAU0MBTQquUSvjg4BQlBO4HCn++\nqKD5AoQh9djZSdT/WhoxUUBDrlreUL3z5kjNJdp5CLftc4eJcFAwfWQkOf+gSzBC\nUuE9AoGAfUr1fvLKjKxYenEyNRpXJCD7SAkM44aN/BxJpAGqA2p9u8qY/hIHLU0n\n/22Ib7bDe0D23KLWYq4J41mrV4Wfh9hUK9eqrVCaHrb8t3LzxrwuQHO/q8ioFTnc\n+UbBUJhoyfOqCgMdfrGOS9tSxleJQi0c3vCmh//DOQ6K6zpbTtA=\n-----END RSA PRIVATE KEY-----\n"
  //   }
  // } ; username = "user0.near"

  publicKey = user[username].public
  privateKey = user[username].private

  // Create some sample data that we want to sign
  const verifiableData = username

  // The signature method takes the data we want to sign, the
  // hashing algorithm, and the padding scheme, and generates
  // a signature in the form of bytes
  let signature = crypto.sign("sha256", Buffer.from(verifiableData), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  });

  // console.log(signature.toString("base64"));

  // // FUCKING FINALLY
  // signature = signature.toString("base64")
  // signature = Buffer.from(signature, "base64")

  // To verify the data, we provide the same hashing algorithm and
  // padding scheme we provided to generate the signature, along
  // with the signature itself, the data that we want to
  // verify against the signature, and the public key
  const isVerified = crypto.verify(
    "sha256",
    Buffer.from(verifiableData),
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    signature
  );

  // isVerified should be `true` if the signature is valid
  console.log("signature verified: ", isVerified);

  // //----------------------------//

  // let signature = crypto.sign("sha256", Buffer.from(verifiableData), {
  //   key: privateKey,
  //   padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  // });

  // let headers = {}

  // const url = "http://localhost:3000/image/"

  // const payload = {
  //   "id": "26fc9ae1-4a56-483a-82d7-b7f40478042b",
  //   "username": username,
  //   "signature": signature.toString("base64")
  // }

  // console.log(signature.toString("base64"))

  // const axiosConfig = {
  //     url: String(url),
  //     method: "post",
  //     data: payload,
  //     headers: Object.assign({
  //         "Content-Type": "application/json"
  //         }, headers
  //     )
  // }

  // try {
  //     const response = await axios.request(axiosConfig)
  //     return response.data
  // } catch(err) {
  //     console.log(err)
  //     return false
  // }

  // return ""
}

get().then(result=>console.log(result))






const moment = require("moment")
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const fs = require("fs");
const smartContract = require("../middlewares/db_manager/scTalker")
const db = require("../middlewares/database/db")
const logger = require("../utils/logger")

// const crypto = require("crypto");
// const smartContract = require("../middlewares/db_manager/scTalker")
// const user = await smartContract.getState(true)
// publicKey = user.public
// privateKey = user.private
// console.log(typeof(publicKey))
// // This is the data we want to encrypt
// const data = "my secret data"
// const encryptedData = crypto.publicEncrypt(
// 	{
// 		key: publicKey,
// 		padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
// 		oaepHash: "sha256",
// 	},
// 	// We convert the data string to a buffer using `Buffer.from`
// 	Buffer.from(data)
// )
// // The encrypted data is in the form of bytes, so we print it in base64 format
// // so that it's displayed in a more readable form
// console.log("encypted data: ", encryptedData.toString("base64"))
// const decryptedData = crypto.privateDecrypt(
// 	{
// 		key: privateKey,
// 		// In order to decrypt the data, we need to specify the
// 		// same hashing function and padding scheme that we used to
// 		// encrypt the data in the previous step
// 		padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
// 		oaepHash: "sha256",
// 	},
// 	encryptedData
// )
// // The decrypted data is of the Buffer type, which we can convert to a
// // string to reveal the original data
// console.log("decrypted data: ", decryptedData.toString())

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
                            return res.status(200).json(output)
                        }
                    }
                } catch(err) {
                    console.log(err)
                }
            }
        }
    }

    return res.status(200).send(`INVALID!`)

    // console.log("MEME: ", isVerified)
    // return res.status(200).json({})

    // const img = __dirname + String(req.params.name);
    // const username = req.body.username
    // const check = req.body.check
  
    // if (fs.existsSync(img)){
    //     fs.readFile(img, function(err, content) {
    //         if (err) {
    //             console.log(err)
    //         } else {
    //             const key = crypto.randomBytes(64).toString('hex')

    //             let output = {
    //                 "image": CryptoJS.Rabbit.encrypt(content, key),
    //                 "encKey": crypto.publicEncrypt(
    //                     {
    //                         key: publicKey,
    //                         padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    //                         oaepHash: "sha256",
    //                     },
    //                     Buffer.from(key)
    //                 )
    //             }
    //             res.writeHead(200, { "Content-type": "application/json" });
    //             res.write(JSON.stringify(output));
    //             res.end();
    //         }
    //     })
    // }
}

module.exports = {
    getImage
}



// const moment = require("moment")
// const CryptoJS = require("crypto-js");
// const crypto = require("crypto");
// const fs = require("fs");
// const smartContract = require("../middlewares/db_manager/scTalker")
// const db = require("../middlewares/database/db")
// const logger = require("../utils/logger")

// async function getImage(req, res) {
//     const username = req.body.username
//     const signature = req.body.signature

//     const scTestData = require("../middlewares/smart_contract/test/testSmartContractTestData.json")
//     const user = scTestData.testUsers[username]
//     const publicKey = user.public

//     console.log(username, signature)

//     const isVerified = crypto.verify(
//       "sha256",
//       Buffer.from(username),
//       {
//         key: publicKey,
//         padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
//       },
//       Buffer.from(signature, "base64")
//     );

//     return res.status(200).send(`${isVerified}`)
// }

// module.exports = {
//     getImage
// }