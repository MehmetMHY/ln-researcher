const crypto = require("crypto")

/*
CREDIT
*/

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

module.exports = {
    encrypt,
    decrypt,
    genRandom32BitKey
}

