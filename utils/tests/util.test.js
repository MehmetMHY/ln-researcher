const util = require("../util")

const config = require("../../config/config.json")

test(`Test if schemaValidate() works correctly for valid, invalid, & error-based params`, () => {
    const schema = require("../../models/imgMetaData").imgMetaData

    // test if function returns true for a valid json
    util.schemaValidate(schema, {
        filepath: "/opt/img.json",
        status: "pending",
        image: { raw: {}, label: {} },
        value: 2.1,
        timeLogs: { uploaded: 1666618833000, completed: 1666618873000, units: "ms" },
        labelers: [
            { username: "example.near", publicKey: "jsds8d8sdsjd8sshds", passedChecks: [ "9sd8sad" ], rating: 1, payment: 1.2 }
        ]
    }).then(result => expect(result).toBe(true))

    // test if function returns false for a valid json
    util.schemaValidate(schema, { 
        username: "example.near", 
        publicKey: "jsds8d8sdsjd", 
        passedChecks: [ "dsdsd8sd" ], 
        rating: 1, 
        payment: 1.2 
    }).then(result => expect(result).toBe(false))
    
    // test if function returns false for an invalid input
    //  - NOTE: check logs to see if function logged
    util.schemaValidate(1, 2).then(result => expect(result).toBe(false))
})