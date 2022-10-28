import { connect, KeyPair, keyStores, utils } from "near-api-js";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import inquirer from "inquirer";
import { execSync } from "child_process";

/**
 * Checks whether or not the specified NEAR account exists
 * The network checked (mainnet, testnet, etc) is determined by near_connection
 * based on code from:
 * https://github.com/near/near-cli/blob/master/commands/create-account.js
 * @param   {string}  account_id      account id (username)
 * @param   {Near}    near_connection connection to NEAR network
 * @returns {boolean}
 */
const account_exists = async (account_id, near_connection) => {
  try {
    const account = await near_connection.account(account_id);
    await account.state(); // will error if account doesn't exist
  } catch (err) {
    // throw any error unrelated to the account not existing
    if (!err.message.includes("does not exist while viewing")) {
      throw err;
    }
    return false;
  }
  return true;
};

/**
 * Creates a new sub account under the specified account
 * The network (mainnet, testnet, etc) is determined by near_connection
 * @param {Account} account         NEAR account object
 * @param {string}  prefix          prefix to distinguish the sub account
 * @param {Near}    near_connection near connection object
 */
const create_sub_account = async (account, prefix, near_connection) => {
  const main_account_id = account.accountId;
  const sub_account_id = `${prefix}.${main_account_id}`;

  // create public / private key pair
  const key_pair = await KeyPair.fromRandom("ed25519");
  const public_key = keyPair.getPublicKey();

  // write keys to local storage
  await near_connection.connection.signer.keyStore.setKey(
    "testnet",
    sub_account_id,
    key_pair
  );

  // create sub account
  try {
    const response = await account.createAccount(
      sub_account_id,
      public_key,
      utils.format.parseNearAmount("200")
    );
    console.log(response);
  } catch (err) {
    throw err;
  }
};

/**
 * Connect to the NEAR network
 * Currently hardcoded to testnet
 * @returns {NEAR} connection to NEAR network
 */
const connect_to_near = async () => {
  // configure public / private key pair storage
  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(
    path.join(os.homedir(), ".near-credentials")
  );

  const connection_config = {
    networkId: "testnet",
    keyStore: keyStore,
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org",
  };
  const near_connection = await connect(connection_config);
  return near_connection;
};

/**
 * Searches for credentials for the given user in local storage
 * Prompts the user to log in to their near account if no credentials are found
 * @param {string} account_id the account to authenticate
 */
const authenticate_user = async (account_id) => {
  const credentials = await fs.promises.readdir(
    path.join(os.homedir(), ".near-credentials", "testnet")
  );

  if (credentials.includes(`${account_id}.json`)) {
    console.log(
      `found existing user credentials in .near-credentials directory`
    );
  } else {
    console.log("redirecting to NEAR login");
    const result = execSync("near login");
  }
};

// prompt user for account id
const { account_id } = await inquirer.prompt([
  {
    type: "input",
    name: "account_id",
    message: "enter you near account id (testnet): ",
  },
]);

// set up near connection and authenticate user
const near_connection = await connect_to_near();
await authenticate_user(account_id);
const account = await near_connection.account(account_id);

// configure sub account
const sub_account_id = `sc.${account_id}`;
if (!(await account_exists(sub_account_id, near_connection))) {
  console.log("creating sub account for smart contract deployment");
  await create_sub_account(account, "sc", near_connection);
} else {
  console.log("found existing sub account");
}
const sub_account = await near_connection.account(sub_account_id);

// check if smart contract has been deployed to sub account
const state = await sub_account.state();
let sc_deployed = state.code_hash != "11111111111111111111111111111111";

// deploy smart contract if necessary
if (!sc_deployed) {
  console.log("deploying smart contract to sub account");
  // build smart contract
  execSync("cd ../contract && npm run build");
  const response = await sub_account.deployContract(
    fs.readFileSync("../contract/build/job_posting.wasm")
  );
  console.log(response);
} else {
  console.log("smart contract already deployed");
}
