# Labeler NearBy - Researcher Smart Contract

# Contract Interface
All contract functionality, including view and change methods, is defined in `contract/src/contract.ts`

# Build Process
To build the smart contract, run the following command in the `contract` directory:

`npm run build`

# Deployment
To deploy the contract, run the following command in the `contract` directory:

`npm run deploy`

# Contract Interaction
Once the smart contract has been built and deployed, methods can be called using either of the two methods described below.

## Using the NEAR command line interface

The NEAR command line interface can be installed using npm.

`npm install --global near-cli`

To call smart contract methods using the NEAR cli, you must first log into an existing NEAR account. This can be done by running the following command:

`near login`

Smart contract methods can then be called using the `view` and `call` functionalities provided by the NEAR cli. Note: args is a stringified JSON object.

### View Method
`near view <contract-account-name> <method-name> <args>`

### Change Method
`near call <contract-account-name> <method-name> <args> --accountId <calling-account-name>`


## Using the NEAR JavaScript API

`contract/scripts/manage-sc.js` demonstrates the functionality described in this section.

To call contract functions using the NEAR JavaScript API, you must first set up a connection to the NEAR network.

```javascript
import NearAPI, { Near } from "near-api-js";
const { connect, KeyPair, keyStores, utils, providers } = NearAPI;

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
```

You will then need to connect to an existing NEAR account.

```javascript
  const account = await connect("<account-id>")
```

Contract methods can then be called using the `viewFunction()` and `functionCall()` methods of the connected account object. Note: args is a json object containing method arguments.

### View Method

```javascript
const result = await account.viewFunction({
  contractId: "<contract-account-name>",
  methodName: "<method-name>",
  args: {},
});
```

### Change Method
```javascript
const response = await account.functionCall({
  contractId: "<contract-account-name>",
  methodName: "<method-name>",
  args: {},
});
const result = providers.getTransactionLastResult(response);
```

