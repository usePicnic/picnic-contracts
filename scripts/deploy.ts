// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");
import { ethers } from "hardhat";
import { readFileSync } from "fs";
import fetch from "node-fetch";
import constants from "../constants";


function delay(ms) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

async function main() {

  const [deployer] = await ethers.getSigners();
  const ADDRESSES = constants['POLYGON'];

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  let Oracle = await ethers.getContractFactory("OraclePath");

  let oracle = (await Oracle.deploy(ADDRESSES['FACTORY']));

  const Pool = await ethers.getContractFactory("Pool");

  // DEPLOY
  const pool = await Pool.deploy(ADDRESSES['ROUTER'], oracle.address);

  console.log("Pool address:", pool.address);  

  // REGISTER ON SERVER
  const contractFile = readFileSync('./artifacts/contracts/Pool.sol/Pool.json', 'utf8')
  const contractData = JSON.parse(contractFile)

  const response = await fetch(
    'https://indexpool-appservice.azurewebsites.net/api/setcontract?code=yKjNRKdRLV4xl5fdmZU6bPveAg6lxpmxmRB3ocSXYTkrCUyXIa3QgA%3D%3D', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        networkName: "polygon-testnet",
        address: pool.address,
        abi: contractData['abi']
      })
    })
  const responseText = await response.text()
  console.log(responseText)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
