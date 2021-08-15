import deployLogic from "./utils/deployLogic";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

const hre = require("hardhat");
const prompts = require("prompts");

const weiToString = (wei) => {
    return wei
        .div(
            BigNumber.from(10).pow(14)
        )
        .toNumber() / Math.pow(10, 4);
}

const contractsToDeploy = [
    { contractName: "IndexPool", filePath: "./artifacts/contracts/IndexPool.sol/IndexPool.json" },
    { contractName: "AaveV2DepositBridge", filePath: "./artifacts/contracts/bridges/AaveV2DepositBridge.sol/AaveV2DepositBridge.json" },
    { contractName: "UniswapV2SwapBridge", filePath: "./artifacts/contracts/bridges/UniswapV2SwapBridge.sol/UniswapV2SwapBridge.json" },
]
async function main() {
    const networkName = hre.hardhatArguments.network;

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const balanceBegin = await deployer.getBalance();
    console.log("Account balance:",weiToString(balanceBegin));

    const response = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to deploy to ${networkName}?`,
        initial: false
      }
    )

    console.log(response.confirm)
    if (!response.confirm) {
        console.log("Aborting");
        return;
    }
  
    for (const c of contractsToDeploy) {
        await deployLogic( {
            networkName: networkName,
            contractName: c.contractName,
            filePath: c.filePath
        } )
    }
    const balanceEnd = await deployer.getBalance();
    console.log("Account balance:",weiToString(balanceEnd));
    console.log("Cost to deploy:",weiToString(balanceBegin.sub(balanceEnd)));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
