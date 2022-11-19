const os = require("os")
const logger = require("../../utils/logger")
const nearAPI = require("near-api-js");
const { utils } = nearAPI
const request = require("../../utils/request")
const path = require("path")
const fs = require("fs")
const child_process = require('child_process')

const CREDENTIALS_DIR = ".near-credentials";

const credentialsPath = path.join(os.homedir(), CREDENTIALS_DIR)
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

// middle main functions are below this line

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

async function getAvailableFunds(contract) {
    return viewFunction(undefined, contract, "get_available_funds", arguments)
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

async function setURL(contract, urlRoot, endpoint=undefined) {
    const output = { status: 0, output: undefined }

    let url = String(urlRoot)
    if(endpoint){
        url = path.join(url, String(endpoint))
    }

    const urlStatus = await request.get(String(url))

    if(urlStatus.status === 1){
        output.status = 1
        logger.error(`${nameForLog} Failed to setURL() due to url endpoint not existing or being down: ${JSON.stringify(urlStatus)}`)
        return output
    }

    const response = await callFunction(contract, contract, "set_url", { "url": url }, undefined)

    if(!response){
        output.status = 1
        output.output = response
        return output
    }

    output.output = response
    return output
}

async function getURL(contract) {
    return viewFunction(undefined, contract, "get_url", {})
}

async function scBuildDeploy(){
    const output = { status: 1, output: {} }
    
    const rootDir = path.join(__dirname, "contracts/")

    if(!fs.existsSync(rootDir)){
        return output
    }

    const cmd = `npm run deploy --prefix ${rootDir}`

    try {
        const results = child_process.execSync(String(cmd)).toString('utf8')

        let lineOne = undefined
        let lineTwo = undefined
        results.split("\n").forEach(function(element){
            if(element.includes("Starting deployment. ")){
                lineOne = element
            }

            if(element.includes("Done deploying to ")){
                lineTwo = element
            }
        })

        if(lineOne && lineTwo){
            const account = lineTwo.split(" ").at(-1)
            const accountData = {}
            lineOne.replace("Starting deployment. ", "").split(", ").forEach(function(element){
                let key = element.split(": ")[0]
                let val = element.split(": ")[1]
                if(key === "Account id"){
                    key = "account"
                }
                accountData[key] = val
            })

            if(account === accountData.account){
                output.status = 0
                output.output = accountData
                logger.info(`${nameForLog} Successfully built and deploy the project's smart contract: ${JSON.stringify(output)}`)
                return output
            } else {
                logger.fatal(`${nameForLog} ${scBuildDeploy.name} because ${account} DOES NOT EQUAL ${accountData.account}`)
            }
        } else {
            logger.fatal(`${nameForLog} Failed to get the results from ${scBuildDeploy.name} due to lineOne = ${lineOne} & lineTwo = ${lineTwo}`)
        }

    } catch (err) {
        logger.fatal(`${nameForLog} The following error occurred resulting in ${scBuildDeploy.name} failing to run correctly: ${err}`)
    }

    output.status = 1
    return output
}

// Ⓝ NEAR Token(s)
const account1 = "dev-1668330613590-55460358134907"
const account2 = "memetime.testnet"
const account3 = "dev-1668330613590-55460358134907"
// sendTokens(account2, account1, 1).then(result=>console.log(JSON.stringify(result,null,indent=4)))
// viewFunction(account2, account1, "get_jobs", {}).then(result=>console.log(result))
// callFunction(account2, account1, "add_funds", {}, 2).then(result=>console.log(result))
// viewFunction(account2, account1, "get_available_funds", {}).then(result=>console.log(result))
// >>>-------------<<<>>>-------------<<<>>>-------------<<<>>>-------------<<<>>>-------------<<< ///
// viewFunction(account2, account1, "get_available_funds", {}).then(result=>console.log(utils.format.formatNearAmount(result.toLocaleString('fullwide', {useGrouping:false}))))
// addFunds(account2, account3, 1).then(result => console.log(JSON.stringify(result,null,indent=2)))
// getAvailableFunds(account3).then(result=>console.log(utils.format.formatNearAmount(result.toLocaleString('fullwide', {useGrouping:false}))))
// getDB(account1).then(result=>console.log(JSON.stringify(result,null,indent=4)))
// addJobs(account1, ["409a-a3db-34740b0142cf", "4286-9a87-0396a177a8df"]).then(result=>console.log(JSON.stringify(result,null,indent=4)))
// cancelJobs(account1, ["409a-a3db-34740b0142cf", "4286-9a87-0396a177a8df"]).then(result=>console.log(JSON.stringify(result,null,indent=4)))
// getStatus(account1, "available").then(result=>console.log(JSON.stringify(result,null,indent=4)))
// setURL(account3, "http://localhost:3000", "health").then(result=>console.log(result))
// getURL(account3).then(result=>console.log(result))

scBuildDeploy().then(result=>console.log(result))