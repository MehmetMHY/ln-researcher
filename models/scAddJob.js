const scAddJob = {
    type: "array",
    items: {
        type: "object",
        properties: {
            id: { type: "string" },
            label_keys: {
                type: "array",
                items: { type: "string" }
            },
            additionalProperties: false
        }
    }
}

module.exports = {
    scAddJob
}
