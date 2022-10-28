const Ajv = require("ajv")

const config = require("../../config/config.json")

const ajv = new Ajv()

test(`Test if object that if a valid imgMetaData scheme passes ajv validation`, () => {
  const imgMetaData = require("../imgMetaData")

  const schema = imgMetaData.imgMetaData

  const testData = {
    filepath: "/opt/img.json",
    status: "pending",
    image: {
      raw: {},
      label: {},
      resolution: {
          height: 1080,
          width: 1920
      }
    },
    value: 2.1,
    timeLogs: {
      uploaded: 1666618833000,
      completed: 1666618873000,
      units: "ms"
    },
    labelers: [
      {
        username: "example.near",
        publicKey: "jsds8d8sdsjd8sshds8ds9dus8d",
        passedChecks: [ "9sd8sad", "dsdsd8sd" ],
        rating: 1,
        payment: 1.2
      }
    ]
  }

  const validate = ajv.compile(schema)

  const valid = validate(testData)

  expect(valid).toBe(true)
})

test(`Test if object that is NOT a valid imgMetaData scheme fails ajv validation`, () => {
  const imgMetaData = require("../imgMetaData")

  const schema = imgMetaData.imgMetaData

  const testData = {
    filepath: "/opt/img.json",
    status: "pending",
    value: "2.1",
    timeLogs: {
      uploaded: 1666618833000,
      completed: 1666618833000
    },
    labelers: [
      {
        username: "example.near",
        publicKey: "jsds8d8sdsjd8sshds8ds9dus8d",
        passedChecks: [ "9sd8sad", "dsdsd8sd" ],
        rating: 1,
        payment: 1.2
      }
    ]
  }

  const validate = ajv.compile(schema)

  const valid = validate(testData)

  expect(valid).toBe(false)
})
  