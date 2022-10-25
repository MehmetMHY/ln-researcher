const imgData = {
    type: "object",
    properties: {
        raw: { type: "object" },
        label: { type: "object" }
    },
    required: ["raw", "label"],
    additionalProperties: false
}

const timeData = {
    type: "object",
    properties: {
        uploaded: { type: "number" },
        completed: { type: "number" }
    },
    required: ["uploaded", "completed"],
    additionalProperties: false
}

const userData = {
    type: "object",
    properties: {
        username: { type: "string" },
        publicKey: { type: "string" },
        passedChecks: { type: "array" },
        rating: { type: "number" },
        payment: { type: "number" }
    },
    required: ["username", "publicKey", "passedChecks", "rating", "payment"],
    additionalProperties: false
}

const imgMetaData = {
    type: "object",
    properties: {
        filepath: { type: "string" },
        status: { enum: ["waiting", "pending", "completed"] },
        image: imgData,
        value: { type: "number" },
        timeLogs: timeData,
        labelers: {
            "type": "array",
            "items": userData
        }
    },
    required: ["filepath", "status", "image", "value", "timeLogs", "labelers"],
    additionalProperties: false
}

module.exports = {
    imgMetaData
}
  