import NearAPI from "near-api-js";
const { connect, KeyPair, keyStores, utils, providers } = NearAPI;
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
 * Check for an existing sub account, create a new one if necessary
 * @param   {string} account_id      id of the main account
 * @param   {Near}   near_connection NEAR connection object
 * @returns                          NEAR account object
 */
const configure_sub_account = async (account_id, near_connection) => {
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
  return sub_account;
};

/**
 * Check for an existing dev account, create a new one if necessary
 * @param   {Near} near_connection Near connection object
 * @returns                        Near account object
 */
const configure_dev_account = async (near_connection) => {
  const account_file_path = path.join("../neardev", "dev-account.json");
  const account_env_path = path.join("../neardev", "dev-account.env");

  const key_store = near_connection.connection.signer.keyStore;

  try {
    const dev_account_id = fs
      .readFileSync(account_file_path)
      .toString("utf8")
      .trim();
    fs.readFileSync(account_env_path);

    if (dev_account_id && (await key_store.getKey("testnet", dev_account_id))) {
      console.log(`using existing dev account ${dev_account_id}`);
      const dev_account = await near_connection.account(dev_account_id);
      return dev_account;
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      if (!fs.existsSync("../neardev")) {
        fs.mkdirSync("../neardev");
      }
    } else {
      throw err;
    }
  }

  console.log("creating new dev account");
  const randomNumber = Math.floor(
    Math.random() * (99999999999999 - 10000000000000) + 10000000000000
  );
  const dev_account_id = `dev-${Date.now()}-${randomNumber}`;

  const keyPair = await KeyPair.fromRandom("ed25519");
  await near_connection.createAccount(dev_account_id, keyPair.getPublicKey());
  await key_store.setKey("testnet", dev_account_id, keyPair);
  fs.writeFileSync(account_file_path, dev_account_id);
  fs.writeFileSync(account_env_path, `CONTRACT_NAME=${dev_account_id}`);

  const dev_account = await near_connection.account(dev_account_id);
  return dev_account;
};

/**
 * Deploy smart contract to specified account
 * Smart contract is currently hard coded
 * @param {Account} account Near account object
 */
const deploy_smart_contract = async (account) => {
  // check if smart contract has been deployed to account
  const state = await account.state();
  let sc_deployed = state.code_hash != "11111111111111111111111111111111";

  if (sc_deployed) {
    const { answer } = await inquirer.prompt([
      {
        type: "input",
        name: "answer",
        message:
          "smart contract already deployed, would you like to re-deploy? (y/n): ",
      },
    ]);

    if (answer != "y") return;
  }

  // deploy smart contract if necessary
  console.log("deploying smart contract");
  // build smart contract
  execSync("npm run build");
  const response = await account.deployContract(
    fs.readFileSync("../build/job_posting.wasm")
  );
};

/**
 * Main funciton to handle overall program flow
 */
const main = async () => {
  // prompt user for account id
  const { account_id } = await inquirer.prompt([
    {
      type: "input",
      name: "account_id",
      message: "enter you near account id (testnet only, blank for dev): ",
    },
  ]);

  // set up near connection and authenticate user
  const near_connection = await connect_to_near();
  let caller_account;
  let contract_account;
  if (account_id) {
    contract_account = await configure_sub_account(account_id, near_connection);
    caller_account = await near_connection.account(account_id);
  } else {
    contract_account = await configure_dev_account(near_connection);
    caller_account = contract_account;
  }
  await deploy_smart_contract(contract_account);

  let response;
  response = await caller_account.viewFunction({
    contractId: contract_account.accountId,
    methodName: "get_available_funds",
    args: {},
  });
  console.log(response);

  response = await caller_account.functionCall({
    contractId: contract_account.accountId,
    methodName: "add_funds",
    args: {},
    attachedDeposit: 10,
  });

  response = await caller_account.functionCall({
    contractId: contract_account.accountId,
    methodName: "add_jobs",
    args: { ids: ["0", "1", "2", "3"] },
  });
  const result = providers.getTransactionLastResult(response);
  console.log(result);
};

await main();
