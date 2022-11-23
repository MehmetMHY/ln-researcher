const smartContract = require("../nearApi")
const config = require("../../../config/config.json").smartContract

const scAccount = config.scAccount
const mainAccount = config.mainAccount

async function printDB(){
    const data = await smartContract.getDB(scAccount)
    console.log(JSON.stringify(data, null, indent=4))
    return
}

async function fundAdd(){
    const before = await smartContract.getAvailableFunds(scAccount)
    console.log("Balance Before:", before)

    const output = await smartContract.addFunds(mainAccount, scAccount, 1)
    console.log(`\nOUTPUT: ${JSON.stringify(output,null,indent=4)} \n`)

    const after = await smartContract.getAvailableFunds(scAccount)
    console.log("Balance After:", after)

    return
}

async function jobsAdd(){
    const currentJobs = [
        {
            id: "4accfce4-c4f8-4f33-aab3-5945bea92cd0",
            label_keys: ["corn-plants", "dirt", "rocks"]
        },
        {
            id: "7c9fb425-afb5-4021-b5e1-dea287bb750c",
            label_keys: ["corn-plants", "dirt", "rocks"]
        }
    ]

    console.log("BEFORE:")
    await printDB()
    
    const output = await smartContract.addJobs(scAccount, currentJobs)
    console.log(`\nOUTPUT: ${JSON.stringify(output)} \n`)
    
    console.log("AFTER:")
    await printDB()

    return
}

async function taskRequest() {
    const output = await smartContract.requestTask(scAccount, mainAccount)
    console.log(`NOTE: If the call worked, SAVE the RSA key pairs (public & private)!`)
    console.log(JSON.stringify(output, null, indent=4))
}

///////////////////////////////////
////// MAIN FUNCTION CALL(S) //////
///////////////////////////////////

///// RANDOMS:
// smartContract.recallTask(scAccount, "4615dfd3-98c6-40b3-971f-073449f05faa", mainAccount).then()

printDB().then()

// fundAdd().then()
// jobsAdd().then()
// taskRequest().then()

