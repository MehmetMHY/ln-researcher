const crypto = require("crypto");
const fs = require("fs")

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

async function encryptImage(filepath) {
    try{
        filepath = String(filepath)

        if(!fs.existsSync(filepath)){
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
    
        let filepathsplit = filepath.split("/")
        filepathsplit[filepathsplit.length-1] = `${filepathsplit[filepathsplit.length-1]}.encrypted`
        let newFilepath = filepathsplit.join("/")
    
        const key = await genRandom32BitKey()
    
        const ogImage = fs.readFileSync(filepath)
        const encryptFile = await encrypt(ogImage, key)
    
        fs.writeFileSync(newFilepath, encryptFile)
    
        return {
            "filepath": newFilepath,
            "key": key
        }
    } catch(e) {
        return undefined
    }
}

async function decryptImage(filepath, key) {
    try{
        filepath = String(filepath)

        if(!filepath.includes(".encrypted")){
            return undefined
        }
    
        if(!fs.existsSync(filepath)){
            return undefined
        }
    
        const encryptFile = fs.readFileSync(filepath)
    
        let filepathsplit = filepath.split("/")
        filepathsplit[filepathsplit.length-1] = filepathsplit[filepathsplit.length-1].replace(".encrypted", "")
        filepathsplit[filepathsplit.length-1] = "decrpt_" + filepathsplit[filepathsplit.length-1]
        let newFilepath = filepathsplit.join("/")

        const decryptFile = await decrypt(encryptFile, key)

        fs.writeFileSync(newFilepath, decryptFile)

        return newFilepath
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

async function main(){
    const filepath = "/Users/mehmet/Desktop/NEAR-DEV/content/img_data/plants_5-18-2019/corn_plants/img_0868.jpg"
    let e = await encryptImage(filepath)
    // if(e){
    //     console.log("E:", JSON.stringify(e))
    //     let d = await decryptImage(e.filepath, e.key)
    //     console.log("D:", JSON.stringify(d))
    //     if(d){
    //         let dfe = await deleteFile(e.filepath)
    //         console.log("\nDFE:", dfe)
    //     }
    // }
    return
}
main().then()

module.exports = {
    encrypt,
    decrypt,
    encryptImage,
    decryptImage
}

