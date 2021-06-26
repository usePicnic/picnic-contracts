// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");
import { ethers } from "hardhat";
import { readFileSync } from "fs";
import fetch from "node-fetch";



function delay(ms) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";

  const Pool = await ethers.getContractFactory("Pool");

  // DEPLOY
  const pool = await Pool.deploy(UNI_ROUTER);

  console.log("Pool address:", pool.address);  

  // REGISTER ON SERVER
  const contractFile = readFileSync('./artifacts/contracts/IndexPool.sol/Pool.json', 'utf8')
  const contractData = JSON.parse(contractFile)

  const response = await fetch(
    'https://indexpool-appservice.azurewebsites.net/api/setcontract?code=yKjNRKdRLV4xl5fdmZU6bPveAg6lxpmxmRB3ocSXYTkrCUyXIa3QgA%3D%3D', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        network_name: "ethereum_indexpool_testnet",
        address: pool.address,
        contract: contractData
      })
    })
  const responseText = await response.text()
  console.log(responseText)

  // // CREATE INDEX
  // const index_id = await pool.create_index(
  //   [1],  // uint256[] _allocation,
  //   [UNI_TOKEN] // address[] _tokens
  // );

  // console.log("Create index result:", index_id);

  // await delay(16000);

  // let overrides = { value: ethers.utils.parseEther("0.01") };

  // // DEPOSIT
  // const deposit_result = await pool.deposit(
  //   0, // _index_id
  //   overrides
  // );

  // console.log("Deposit result:", deposit_result);

  // await delay(16000);

  // // WITHDRAW
  // const withdraw_result = await pool.withdraw(
  //   100, // _sell_pct
  //   0,   // _index_id
  // );

  // console.log("Withdraw result:", withdraw_result);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
