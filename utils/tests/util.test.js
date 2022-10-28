const util = require("../util")

const config = require("../../config/config.json")

test(`Test if schemaValidate() works correctly for valid, invalid, & error-based params`, () => {
    const schema = {
        type: "object",
        properties: {
            a: { type: "object" },
            b: { type: "string" },
            c: { type: "number" }
        },
        required: ["a", "b", "c"],
        additionalProperties: false
    }

    // test if function returns true for a valid json
    util.schemaValidate(schema, {
        a: {},
        b: "test",
        c: 0
    }).then(result => expect(result).toBe(true))

    // test if function returns false for a valid json
    util.schemaValidate(schema, { 
        x: -1,
        y: -1,
        z: -1
    }).then(result => expect(result).toBe(false))
    
    // test if function returns false for an invalid input
    //  - NOTE: check logs to see if function logged
    util.schemaValidate(1, 2).then(result => expect(result).toBe(false))
})