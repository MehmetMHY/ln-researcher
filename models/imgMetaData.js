const imgMetaData = {
    type: "object",
    properties: {
        id: { type: "string" },
        filepath: { type: "string" },
        status: { enum: ["waiting", "pending", "completed"] },
        cost: { type: "number" },
        uploaded: { type: "number" },
        completed: { type: "number" },
        timeUnits: { enum: ["ms", "s"] },
        finalLabels: { type: "object" },
        scDataRaw: { type: "object" },
        usedSignatures: { type: "array" }
    },
    required: ["filepath", "status", "cost", "uploaded", "completed", "timeUnits", "finalLabels", "scDataRaw", "usedSignatures"],
    additionalProperties: false
}

module.exports = {
    imgMetaData
}
