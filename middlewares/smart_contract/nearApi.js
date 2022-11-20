// All credit goes to: https://docs.near.org/tools/near-api-js/quick-reference

const child_process = require('child_process')
const fs = require("fs")
const os = require("os")
const path = require("path")
const nearAPI = require("near-api-js");
const { utils } = nearAPI

const logger = require("../../utils/logger")
const request = require("../../utils/request")

const config = require("../../config/config.json").smartContract
const credentialsPath = path.join(os.homedir(), ".near-credentials") // look for keys in $HOME/.near-credentials (default)

const myKeyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
const connectionConfig = Object.assign({keyStore: myKeyStore}, config.connectionConfig)

const nameForLog = `[nearApi]`

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

// send tokens to a stated NEAR account
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

/////////////////////////////////////////////////////
//// middle main functions are below these lines ////
/////////////////////////////////////////////////////

async function getDB(contract, id=undefined) {
    let arguments = {}

    if(id){
        arguments = {"ids": [String(id)]}
    }

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

async function returnFunds(contract, recipient) {
    const output = { status: 0, output: undefined }

    const response = await callFunction(contract, contract, "return_funds", { "recipient": recipient }, undefined)

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

// (11-19-2022) warning : this function should not be used for the final product but it works for testing
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

module.exports = {
    getAccountBalance,
    sendTokens,
    viewFunction,
    callFunction,
    getDB,
    addFunds,
    getAvailableFunds,
    addJobs,
    cancelJobs,
    getStatus,
    setURL,
    getURL,
    scBuildDeploy,
    returnFunds
}
