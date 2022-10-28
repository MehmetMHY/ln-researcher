import { connect, KeyPair, keyStores, utils, Contract } from "near-api-js";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import inquirer from "inquirer";
import { execSync } from "child_process";

const homedir = os.homedir();
const NEAR_CREDENTIALS_DIR = ".near-credentials";
const credentials_path = path.join(homedir, NEAR_CREDENTIALS_DIR);

// comfigure public / private key storage
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentials_path);

// prompt user for account id
const { account_id } = await inquirer.prompt([
  {
    type: "input",
    name: "account_id",
    message: "enter you near account id (testnet): ",
  },
]);

const credentials = await fs.promises.readdir(
  path.join(credentials_path, "testnet")
);

if (credentials.includes(`${account_id}.json`)) {
  console.log(`found user credentials in ${credentials_path}`);
} else {
  console.log("redirecting to NEAR login");
  const result = execSync("near login");
}

// connect to NEAR and main account
const connection_config = {
  networkId: "testnet",
  keyStore: keyStore,
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
};
const near_connection = await connect(connection_config);
const account = await near_connection.account(account_id);

// create sub account if it doesn't exist, then connect
// based on code from:
// https://github.com/near/near-cli/blob/master/commands/create-account.js
const sub_account_id = `sc.${account_id}`;
let sa_exists = false;
try {
  const sub_account = await near_connection.account(sub_account_id);
  await sub_account.getAccountBalance(); // will error if account doesn't exist
  sa_exists = true;
} catch (err) {
  if (!err.message.includes("does not exist while viewing")) {
    throw err;
  }
}

sa_exists
  ? console.log("sub account already exists")
  : console.log("creating sub account for smart contract deployment");

if (!sa_exists) {
  // create key pair for sub account and store in local keystore
  const key_pair = await KeyPair.fromRandom("ed25519");
  const public_key = key_pair.getPublicKey();
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
    console.log(err);
  }
}
const sub_account = await near_connection.account(sub_account_id);

// check if smart contract has been deployed to sub account
const state = await sub_account.state();
let sc_deployed = state.code_hash != "11111111111111111111111111111111";

sc_deployed
  ? console.log("smart contract already deployed")
  : console.log("deploying smart contract to sub account");

if (!sc_deployed) {
  // build smart contract
  execSync("cd ../contract && npm run build");
  const response = await sub_account.deployContract(
    fs.readFileSync("../contract/build/job_posting.wasm")
  );
  console.log(response);
}
