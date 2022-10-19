const Joi = require("joi")
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const fs = require("fs");
const express = require('express')

const app = express()
app.use(express.json())

app.post('/', (req, res) => {
  let img = __dirname + "/data/img_1155.jpg";

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
  });

  fs.readFile(img, function(err, content) {
      if (err) {
          console.log(err)
      } else {
          const key = crypto.randomBytes(64).toString('hex')

          let output = {
              "image": CryptoJS.Rabbit.encrypt(content, key),
              "encKey": crypto.publicEncrypt(
                  {
                      key: publicKey,
                      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                      oaepHash: "sha256",
                  },
                  Buffer.from(key)
              )
          }
          res.writeHead(200, { "Content-type": "application/json" });
          res.write(JSON.stringify(output));
          res.end();
      }
  })
})

// run server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Example app listening on port ${port}. Check out http://localhost:${port} if you running this API locally.`)
})


