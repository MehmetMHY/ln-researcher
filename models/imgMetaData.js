const imgMetaData = {
    type: "object",
    properties: {
        filepath: { type: "string" },
        status: { enum: ["waiting", "pending", "completed"] },
        cost: { type: "number" },
        uploaded: { type: "number" },
        completed: { type: "number" },
        timeUnits: { enum: ["ms", "s"] },
        finalLabels: { type: "object" },
        scDataRaw: { type: "object" }
    },
    required: ["filepath", "status", "cost", "uploaded", "completed", "timeUnits", "finalLabels", "scDataRaw"],
    additionalProperties: false
}

module.exports = {
    imgMetaData
}
