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

async function nearsValueConvert(value, to){
    if(typeof(value) !== "number"){
        return undefined
    }

    const ratio = Math.pow(10, 24)

    switch(to) {
        case "near":
            return value / ratio
        case "yocto":
            return value * ratio
        default:
            return undefined
    }
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




