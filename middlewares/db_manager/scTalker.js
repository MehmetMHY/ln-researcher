const scTest = require("../smart_contract/test/index")

async function getState(testmode=false){
    if (testmode) {
        const testData = await scTest.getTestData()
        return testData.output
    } else {
        return [] // TODO: connect this with the function(s) that communicates with the deployed NEAR smart contract(s)
    }
}

module.exports = {
    getState
}

