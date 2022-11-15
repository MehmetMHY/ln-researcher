const imgEndpoint = {
    type: "object",
    properties: {
        id: { type: "string" },
        username: { type: "string" },
        signature: { type: "string" }
    },
    required: ["username", "signature", "id"],
    additionalProperties: false
}

module.exports = {
    imgEndpoint
}
