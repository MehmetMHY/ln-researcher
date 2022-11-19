const os = require("os")
const logger = require("../../utils/logger")
const nearAPI = require("near-api-js");
const { utils } = nearAPI;

const CREDENTIALS_DIR = ".near-credentials";

const credentialsPath = require("path").join(os.homedir(), CREDENTIALS_DIR)
const myKeyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

const nameForLog = `[nearApi]`

const connectionConfig = {
    networkId: "testnet",
    keyStore: myKeyStore, // first create a key store 
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org"
}

// get account balance for a stated NEAR account
async function getAccountBalance(accountName){
    const output = { status: true, account: accountName, output: {} }

    try {
        const nearConnection = await nearAPI.connect(connectionConfig);
        const account = await nearConnection.account(accountName);
        output.output = await account.getAccountBalance()
    } catch(err) {
        logger.error(`${nameForLog} Failed to get ${accountName} account balance due to the following error: ${err}`)
        output.status = false
    }

    return output
}

async function sendTokens(sender, receiver, amount){
    const status = { 
        status: false, 
        setting: {
            "sender": sender,
            "receiver": receiver,
            "amount": amount
        },
        amountSent: "",
        output: {}
    }

    if(typeof(amount) !== 'number'){
        logger.error(`${nameForLog} Failed to attempt to send tokens due to amount ${amount} NOT being type number. Status: ${JSON.stringify(status)}`)
        return status
    }
    
    try {
        amount = amount.toLocaleString('fullwide', {useGrouping:false})
        amount = utils.format.parseNearAmount(amount) // convert near to yoctoNEAR

        sender = String(sender)
        receiver = String(receiver)

        const nearConnection = await nearAPI.connect(connectionConfig);
        const account = await nearConnection.account(sender);
        const sendResponse = await account.sendMoney(
            receiver, // receiver account
            amount // amount in yoctoNEAR
        )

        status.status = true
        status.amountSent = amount
        status.output = sendResponse

        logger.info(`${nameForLog} Successfully sent tokens. Here is the data for the transaction: ${JSON.stringify(status)}`)
    } catch(err) {
        logger.error(`${nameForLog} Failed to send tokens due to something not being valid with the request (status: ${JSON.stringify(status)}), resulting in the following error: ${err}`)
        status.status = false
    }

    return status
}

async function viewFunction(requester, contract, method, arguments){
    const params = {
        "requester": requester,
        "contract": contract,
        "method": method,
        "arguments": arguments
    }

    try {
        const nearConnection = await nearAPI.connect(connectionConfig)
        const account = await nearConnection.account(requester)
    
        const response = await account.viewFunction({
            contractId: contract,
            methodName: method,
            args: arguments
        })
    
        return response

    } catch(err) {
        logger.error(`${nameForLog} Failed to ${viewFunction.name}, with params ${JSON.stringify(params)}, due to the following error: ${err}`)
        return undefined
    }
}

async function callFunction(requester, contract, method, arguments, deposit){
    const params = {
        "requester": requester,
        "contract": contract,
        "method": method,
        "arguments": arguments,
        "deposit": deposit
    }

    try {
        let longDeposit = deposit
        if(deposit){
            longDeposit = utils.format.parseNearAmount(deposit.toLocaleString('fullwide', {useGrouping:false}))
        }

        const nearConnection = await nearAPI.connect(connectionConfig)
        const account = await nearConnection.account(requester)
    
        const response = await account.functionCall({
            contractId: contract,
            methodName: method,
            args: arguments,
            attachedDeposit: longDeposit
        })
    
        return response

    } catch(err) {
        logger.error(`${nameForLog} Failed to ${callFunction.name}, with params ${JSON.stringify(params)}, due to the following error: ${err}`)
        return undefined
    }
}

//-----------------------------------------------------//

async function getDB(contract, id=undefined) {
    let arguments = {}

    if(id){
        arguments = {"ids": [String(id)]}
    }

    // arguments = JSON.stringify(arguments)

    const response = viewFunction(undefined, contract, "get_jobs", arguments)

    return response
}

async function addFunds(from, to, amount) {
    const output = { status: 0, output: undefined }

    const response = await callFunction(from, to, "add_funds", {}, amount)

    if(!response){
        output.status = 1
        output.output = response
        return output
    }

    output.output = response
    return output
}

async function addJobs(contract, jobs) {
    const output = { status: 0, output: undefined }

    const response = await callFunction(contract, contract, "add_jobs", { "ids": jobs }, undefined)

    if(!response){
        output.status = 1
        output.output = response
        return output
    }

    output.output = response
    return output
}

async function cancelJobs(contract, jobs) {
    const output = { status: 0, output: undefined }

    const response = await callFunction(contract, contract, "cancel_jobs", { "ids": jobs }, undefined)

    if(!response){
        output.status = 1
        output.output = response
        return output
    }

    output.output = response
    return output
}

async function getStatus(contract, type) {
    const options = [ "available", "in_progress", "completed" ]
    
    type = String(type)
    
    if(!options.includes(type)){
        return undefined
    }

    const response = viewFunction(undefined, contract, "get_jobs", {"status": type})

    return response
}

// Ⓝ NEAR Token(s)
const account1 = "dev-1668330613590-55460358134907"
const account2 = "memetime.testnet"
// sendTokens(account2, account1, 1).then(result=>console.log(JSON.stringify(result,null,indent=4)))
// viewFunction(account2, account1, "get_jobs", {}).then(result=>console.log(result))
// callFunction(account2, account1, "add_funds", {}, 2).then(result=>console.log(result))
// viewFunction(account2, account1, "get_available_funds", {}).then(result=>console.log(result))
// >>>-------------<<<>>>-------------<<<>>>-------------<<<>>>-------------<<<>>>-------------<<< ///
// viewFunction(account2, account1, "get_available_funds", {}).then(result=>console.log(utils.format.formatNearAmount(result.toLocaleString('fullwide', {useGrouping:false}))))
// addFunds(account2, account1, 1).then(result => console.log(JSON.stringify(result,null,indent=2)))
// getDB(account1).then(result=>console.log(JSON.stringify(result,null,indent=4)))
// addJobs(account1, ["409a-a3db-34740b0142cf", "4286-9a87-0396a177a8df"]).then(result=>console.log(JSON.stringify(result,null,indent=4)))
// cancelJobs(account1, ["409a-a3db-34740b0142cf", "4286-9a87-0396a177a8df"]).then(result=>console.log(JSON.stringify(result,null,indent=4)))
// getStatus(account1, "available").then(result=>console.log(JSON.stringify(result,null,indent=4)))


