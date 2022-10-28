const resolutionData = {
    type: "object",
    properties: {
        height: { type: "number" },
        width: { type: "number" }
    },
    required: ["height", "width"],
    additionalProperties: false
}

const imgData = {
    type: "object",
    properties: {
        raw: { type: "object" },
        label: { type: "object" },
        resolution: resolutionData
    },
    required: ["label", "resolution"],
    additionalProperties: false
}

const timeData = {
    type: "object",
    properties: {
        uploaded: { type: "number" },
        completed: { type: "number" },
        units: { enum: ["ms", "s"] }
    },
    required: ["uploaded", "completed", "units"],
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
  