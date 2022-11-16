const crypto = require("crypto");
const fs = require("fs")
const path = require('path');

const imageFormats = require("../config/fileFormats.json").image

/*
CREDIT - Encrpt a buffer given a key and encryption algorithm (or default to aes-256-ctr)
This function was taken directory from Anne Douwe Bouma's Medium article:
    - 11-15-2022 : https://medium.com/@anned20/encrypting-files-with-nodejs-a54a0736a50a
*/
async function encrypt(buffer, key, algorithm='aes-256-ctr') {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return result;
}

/*
CREDIT - Decrypt an encrypted buffle given a key and encryption algorithm (or default to aes-256-ctr)
This function was taken directory from Anne Douwe Bouma's Medium article:
    - 11-15-2022 : https://medium.com/@anned20/encrypting-files-with-nodejs-a54a0736a50a
*/
async function decrypt(encrypted, key, algorithm='aes-256-ctr') {
   const iv = encrypted.slice(0, 16);
   encrypted = encrypted.slice(16);
   const decipher = crypto.createDecipheriv(algorithm, key, iv);
   const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
   return result;
}

/*
CREDIT - Generate a random 32 bit key from a random byte hex string
This function was partly built by Anne Douwe Bouma's Medium article:
    - 11-15-2022 : https://medium.com/@anned20/encrypting-files-with-nodejs-a54a0736a50a
*/
async function genRandom32BitKey(){
    let key = crypto.randomBytes(64).toString('hex')
    key = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32)
    return key
}

async function encryptImage(filepath, newFileDir) {
    try{
        filepath = String(filepath)

        if(!fs.existsSync(filepath) || !fs.existsSync(newFileDir)){
            return undefined
        }
    
        let isImageFile = false
        for(let i = 0; i < imageFormats.length; i++){
            if(filepath.includes(imageFormats[i])){
                isImageFile = true
                break
            }
        }
    
        if(!isImageFile){
            return undefined
        }
    
        let filePathSplit = filepath.split("/")
        const newFileName = `encrypted_${filePathSplit[filePathSplit.length-1]}`
        const newFilePath = path.join(newFileDir, newFileName);
    
        const key = await genRandom32BitKey()
    
        const ogImage = fs.readFileSync(filepath)
        const encryptFile = await encrypt(ogImage, key)
    
        fs.writeFileSync(newFilePath, encryptFile)
    
        return {
            "filepath": newFilePath,
            "key": key
        }

    } catch(e) {
        return undefined
    }
}

async function decryptImage(filepath, newFileDir, key) {
    try{
        filepath = String(filepath)

        if(!filepath.includes("encrypted_")){
            return undefined
        }
    
        if(!fs.existsSync(filepath) || !fs.existsSync(newFileDir)){
            return undefined
        }
    
        const encryptFile = fs.readFileSync(filepath)
    
        let filePathSplit = filepath.split("/")
        let newFileName = "decrpt_" + filePathSplit[filePathSplit.length-1].replace("encrypted_", "")
        const newFilePath = path.join(newFileDir, newFileName);

        const decryptFile = await decrypt(encryptFile, key)

        fs.writeFileSync(newFilePath, decryptFile)

        return newFilePath
        
    } catch(e){
        return undefined
    }
}

async function deleteFile(filepath){
    filepath = String(filepath)

    if(fs.existsSync(filepath)){
        try {
            fs.unlinkSync(filepath)
        } catch(err) {
            // failed to delete file
        }
        return true
    }

    return false
}

async function test_encryptImage_decryptImage(filepath, to){
    let e = await encryptImage(filepath, to)
    if(e){
        console.log("E:", JSON.stringify(e))
        let d = await decryptImage(e.filepath, to, e.key)
        console.log()
        console.log("D:", JSON.stringify(d))
        if(d){
            let dfe = await deleteFile(e.filepath)
            console.log("\nDFE:", dfe)
        }
    }
    return
}

// const filepath = "/Users/mehmet/Desktop/NEAR-DEV/content/img_data/plants_5-18-2019/corn_plants/img_0868.jpg"
// const to = "/Users/mehmet/Desktop/NEAR-DEV/ln-researcher/controllers/"
// test_encryptImage_decryptImage(filepath, to).then()

module.exports = {
    encrypt,
    decrypt,
    encryptImage,
    decryptImage,
    deleteFile
}

