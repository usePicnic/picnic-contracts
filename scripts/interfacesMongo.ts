import {MongoClient} from 'mongodb';
import {readFileSync} from "fs";
const hre = require("hardhat");

function bridgeNameToFilePath(interfaceName : string) : string{
    return `./artifacts/contracts/bridges/interfaces/${interfaceName}.sol/${interfaceName}.json`;
}

// TODO rewrite this so we have a single deploy file

const interfacesToDeploy = [
    {
        interfaceName: "IDeFiBasket",
        filePath: "./artifacts/contracts/interfaces/IDeFiBasket.sol/IDeFiBasket.json"
    },
    {
        interfaceName: "IAaveV2Deposit",
        filePath: bridgeNameToFilePath("IAaveV2Deposit")
    },
    {
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("IUniswapV2Swap")
    },
    {
        interfaceName: "IUniswapV2Liquidity",
        filePath: bridgeNameToFilePath("IUniswapV2Liquidity")
    },
    {
        interfaceName: "IWMaticWrap",
        filePath: bridgeNameToFilePath("IWMaticWrap")
    },
    {
        interfaceName: "IAutofarmDeposit",
        filePath: bridgeNameToFilePath("IAutofarmDeposit")
    },
    {
        interfaceName: "IBalancerLiquidity",
        filePath: bridgeNameToFilePath("IBalancerLiquidity")
    },
    {
        interfaceName: "IBalancerSwap",
        filePath: bridgeNameToFilePath("IBalancerSwap")
    },
    {
        interfaceName: "IHarvestDeposit",
        filePath: bridgeNameToFilePath("IHarvestDeposit")
    },
    {
        interfaceName: "ICurveLiquidity",
        filePath: bridgeNameToFilePath("ICurveLiquidity")
    },
    {
        interfaceName: "ICurveSwap",
        filePath: bridgeNameToFilePath("ICurveSwap")
    }
]

async function main() {
    const networkName = hre.hardhatArguments.network;

    if (networkName === undefined) {
        console.log('Please set a network before deploying :D');
        return;
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();

        for (let i = 0; i < interfacesToDeploy.length; i++){

            const contractFile = readFileSync(
                interfacesToDeploy[i].filePath,
                'utf8')
            const contract = JSON.parse(contractFile)

            await client
                .db(process.env.MONGODB_DATABASE_NAME)
                .collection('interfaces')
                .updateOne(
                    {name: interfacesToDeploy[i].interfaceName},
                    {"$set":{name: interfacesToDeploy[i].interfaceName,
                        networkName: networkName,
                        abi: contract.abi}},
                    {upsert: true}
                )
        }

    } finally {
        await client.close();
    }


}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
