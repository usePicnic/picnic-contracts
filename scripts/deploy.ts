// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");
import {ethers} from "hardhat";
import {readFileSync} from "fs";
import fetch from "node-fetch";
import constants from "../constants";

require('dotenv').config()

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log(process.env.HI);
    const [deployer] = await ethers.getSigners();
    // const ADDRESSES = constants['POLYGON'];

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    console.log("Deploying IndexPool contract");
    const IndexPool = await ethers.getContractFactory("IndexPool");
    const indexPool = await IndexPool.deploy();

    console.log(`IndexPool contract deployed at: ${indexPool.address}`);

    const indexPoolFile = readFileSync('./artifacts/contracts/IndexPool.sol/IndexPool.json', 'utf8')
    const indexPoolContract = JSON.parse(indexPoolFile)

    const response = await fetch(
        'https://indexpool-appservice.azurewebsites.net/api/setcontract?code=yKjNRKdRLV4xl5fdmZU6bPveAg6lxpmxmRB3ocSXYTkrCUyXIa3QgA%3D%3D', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                networkName: "polygon",
                address: indexPool.address,
                abi: indexPoolContract['abi'],
            })
        })
    console.log(`MongoDB updated with new IndexPool contract values`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
