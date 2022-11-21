<h1 align="center">Labeler NearBy - Researcher</h1>
<p align="center">
  <img width="200" src="./assets/repoImgs/ln-logo.png">
</p>

## ⚠️ WARNING:
- (11-21-2022) This code is not finished and has a long ways to go. Many componets are completed but not all functionality has been implmented and/or thorough tested. Use this code at your on risk.

## What is the Labeler NearBy project?
- Labeler NearBy (ln) is a decentralized platform where machine learning researchers can outsource data labeling to labelers around the world. This is done by using ln-researcher, ln-labeler, and NEAR smart contract(s).
- The ultimate goal of this project is to provide an ecosystem for machine learning researchers to have their data labeled by labelers around the world.
- Labeler NearBy consists of the following projects:
  - ln-researcher : https://github.com/MehmetMHY/ln-researcher
  - ln-labeler : https://github.com/dylan-eck/ln-labeler

## Project Layout:
- assets : contains assets for the repo, such as documents and images
- config : contains the project config file(s)
- controllers : contains all functions used by the API
- middlewares : contains all middleware software
  - cli : contains functions for project's cli (very under developmented at the moment)
  - database : contains functions for talking with the project database (Postgusql)
  - db_manager : contains functions used by the manager
  - smart_contract : contains smart contract code, code that builds & deploys the smart contract, as well as functions that talk with te smart contract.
- models : contains all schemas used for this projects
- routes : contains the routes/endpoints for the project's API
- utils : contains general functions used thoughout the project
- app.js : main script for running the project's API
- manager.js : main script for runnign the project's manager 
- .env.development : all environment variable for a development deployment
- .env.production : all environment vartables for a production deployment

## About:
- The reseacher can host their data though ln-researcher ([this-repo](https://github.com/MehmetMHY/ln-researcher)) and allow labelers using ln-labeler ([here](https://github.com/dylan-eck/ln-labeler)) to label the data provided by the ln-researcher. In exchange for their work, the labeler will get rewarded with NEAR. This exchange of jobs and labels is handled my smart contracts hosted on the NEAR protocal blockchain.
- Currently, there is only one smart contract used for ln-researcher, and this contract is deployed by the researcher. This smart contract's main purpose is the provide data labeling jobs to real people (by taking and sending back funds from the NEAR user), determine the best label by using a voting system (Schulze method), and make sure the labeler that provides the best label(s) gets paid. The smart contract acts as both a payment system as well as a judge of shorts that makes sure a labeler gets paided and that a researcher gets their data labeled; everyone does their job.
- The Labeler NearBy project was started for the [2022 NEAR Metabuild III hackathon](https://metabuild.devpost.com/). But, if there is enough demand, the goal is to expand this project into something bigger than just a hackathon project.
- Currently this project only focuses on labeling image data using squal and polyges labeling but the goal is to expend it to label many other types of data.
- All smart contracts for this project will be deployed to testnet until further notice. The code base is still needs time to mature and the code needs to get audited.

## Project's Components:
- Database : A Postgresql database that holds data about the image, it's labels, and any other information from the smart contract. This database is mainly used by the API and the Manager.
- API : The API that the labeler can use to access the researcher's data (images). This API was designed to be secure and make it such that only the assigned labeler, using NEAR, can access/view the image. This is done by using encrpytion, RSA Keys, a NEAR smart contract, as well as the certain data stored in the database. 
- Manager : The manager is a component that manages both the local database (Postgresql) as well as the data stored in the smart contract. It makes sure the local database is in sync with the smart contract's data and it manages what jobs get added and/or removed from the smart contract.
- Smart Contract : Read the details below for information about the smart contract for this project.
- CLI : A command line interface for this project (very under developmented at the moment)

## How To Setup:
- ⚠️ Please Read: This code is not finished and has a long ways to go. But this is currently how this project gets built for testing and development.
0. Ideally be on a Macbook or Linux system. This project is not designed for Windows at the moment.
1. Make sure to have the following installed:
- NodeJS : https://nodejs.org/en/
- Yarn : https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable
- NPM : https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- Docker : https://docs.docker.com/get-docker/
2. Install the following global packages:
  ```
  npm i near-cli -g
  npm install -g pino-pretty
  ```
3. Log into your NEAR account (testnet):
  ```
  near login
  ```
4. Clone this rep: https://github.com/MehmetMHY/ln-researcher
5. Go to the directory for the ln-researcher you just cloned in step #2 using cd. The rest of the steps assume your at <your_path>/ln-researcher/
6. Run yarn:
  ```
  yarn
  ```
7. Go to the project's smart contract directory:
  ```
  cd middlewares/smart_contract/contracts
  ```
8. Run Npm in the contracts directory (in the smart contract directory):
  ```
  npm install
  ```
9. Build & deploy the smart contract (in the smart contract directory):
  ```
  # this will create & deploy a smart contract then print the name of that smart contract. SAVE THAT smart contract name for later step(s):
  npm run deploy
  ```
10. Setup the database:
  - To do this, read the following documentation located in this repo: https://github.com/MehmetMHY/ln-researcher/blob/main/assets/docs/postgus-setup.md
11. After everything is setup got back to the repo's root directory and go into the config directory:
  ```
  cd - 
  cd config/
  ```
12. From here, check out the [config.json](https://github.com/MehmetMHY/ln-researcher/blob/main/config/config.json). Modify the values in this json for your setup and save your changes. The main key-values to look into are the following:
  - logfile : the path to a file that the logger will use for logging
  - smartContract.mainAccount : the username of the near account you added
  - smartContract.scAccount : the name/username of the near smart contract you created in step #9
  - smartContract.maxJobsPerRound : the max number of jobs you want the smart contract to hold (be careful with this value).
  - smartContract.paymentPerImageNEAR : how much near your willing to pay per jon (be careful and fair with this value).
  - dataDirPath : directory path to your directory of images you want to label.
  - whatToLabel : the tags for you labels (array of strings)
  - labelDescriptionPath: file path to description text which should contain a descript and/or steps of how you want your labeler to label your images.
  - managerPauseTimeSeconds: how many seconds the manager should pause/rest before a new cycle of checking/sync data from the smart contract and the local (postgus) database.
13. Now, build the local database. To do this, run the following command:
  ```
  yarn addDB
  ```
14. Now, everything should be setting and you should be able to use thse other commands:
  ```
  # view the logs produced by all the scripts in this project
  yarn logs

  # run the API
  yarn devRunAPI

  # run the manager
  yarn devRunManager
  ```
15. After all of this, you can also checkout ln-labeler: https://github.com/dylan-eck/ln-labeler

## Credits:
- This project uses the layout discussed on this amazing article: https://dev.to/nermineslimane/how-to-structure-your-express-and-nodejs-project-3bl
- Citing code correctly: https://integrity.mit.edu/handbook/writing-code
- All the links to the sources that helped me build this project:
  - https://github.com/MehmetMHY/ln-researcher/blob/main/assets/docs/sources.txt


