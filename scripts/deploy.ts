import deployLogic from "./utils/deployLogic";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {MongoClient} from 'mongodb';

const hre = require("hardhat");
const prompts = require("prompts");

const weiToString = (wei) => {
    return wei
        .div(
            BigNumber.from(10).pow(14)
        )
        .toNumber() / Math.pow(10, 4);
}

function bridgeNameToFilePath(bridgeName : string) : string{
    return `./artifacts/contracts/bridges/trusted/${bridgeName}/${bridgeName}.sol/${bridgeName}.json`;
}

const contractsToDeploy = [
    {
        contractName: "DeFiBasket",
        interfaceName: "IDeFiBasket",
        filePath: "./artifacts/contracts/DeFiBasket.sol/DeFiBasket.json"
    },
    {
        contractName: "AaveV2DepositBridge",
        interfaceName: "IAaveV2Deposit",
        filePath: bridgeNameToFilePath("AaveV2DepositBridge")
    },
    {
        contractName: "QuickswapSwapBridge",
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("QuickswapSwapBridge")
    },
    {
        contractName: "QuickswapLiquidityBridge",
        interfaceName: "IUniswapV2Liquidity",
        filePath: bridgeNameToFilePath("QuickswapLiquidityBridge")
    },
    {
        contractName: "SushiSwapBridge",
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("QuickswapSwapBridge")
    },
    {
        contractName: "SushiLiquidityBridge",
        interfaceName: "IUniswapV2Liquidity",
        filePath: bridgeNameToFilePath("QuickswapLiquidityBridge")
    },
    {
        contractName: "AutofarmDepositBridge",
        interfaceName: "IAutofarmDeposit",
        filePath: bridgeNameToFilePath("AutofarmDepositBridge")
    },
    {
        contractName: "WMaticWrapBridge",
        interfaceName: "IWMaticWrap",
        filePath: bridgeNameToFilePath("WMaticWrapBridge")
    },
]

async function main() {
    const networkName = hre.hardhatArguments.network;

    if (networkName === undefined) {
        console.log('Please set a network before deploying :D');
        return;
    }

    const startBlockNumber = await ethers.provider.getBlockNumber();

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const balanceBegin = await deployer.getBalance();
    console.log("Account balance:", weiToString(balanceBegin));

    let startingNonce = await deployer.getTransactionCount();
    console.log('Starting nonce:', startingNonce);

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

    var allOk = true;

    for (var i = 0; i < contractsToDeploy.length; i++) {
        let nonce = await deployer.getTransactionCount();
        const isOk = await deployLogic({
            networkName: networkName,
            contractName: contractsToDeploy[i].contractName,
            interfaceName: contractsToDeploy[i].interfaceName,
            filePath: contractsToDeploy[i].filePath,
            nonce: nonce
        })
        if (!isOk) {
            allOk = false;
        }
    }
    const balanceEnd = await deployer.getBalance();
    console.log("Account balance:", weiToString(balanceEnd));
    console.log("Cost to deploy:", weiToString(balanceBegin.sub(balanceEnd)));

    if (!allOk) {
        console.log('There was a problem during deployment. Will not set network blockNumber.')
    } else {
        const client = new MongoClient(process.env.MONGODB_URI);
        try {
            await client.connect();

            console.log(`Setting network blockNumber to ${startBlockNumber}`)

            await client
                .db(process.env.MONGODB_DATABASE_NAME)
                .collection('networks')
                .updateOne(
                    {
                        'name': networkName
                    },
                    {
                        $set: {
                            'latestBlock': startBlockNumber
                        }
                    }
                );
        } finally {
            await client.close();
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
