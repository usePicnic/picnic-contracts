import {readFileSync} from "fs";
const hre = require("hardhat");
const prompts = require("prompts");

function bridgeNameToFilePath(interfaceName : string) : string{
    return `./artifacts/contracts/bridges/interfaces/${interfaceName}.sol/${interfaceName}.json`;
}

// TODO rewrite this so we have a single deploy file

const interfaces = [
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
        interfaceName: "IUniswapV3Swap",
        filePath: bridgeNameToFilePath("IUniswapV3Swap")
    },
    {
        interfaceName: "IJarvisV4Mint",
        filePath: bridgeNameToFilePath("IJarvisV4Mint")
    },
    {
        interfaceName: "IJarvisV6Mint",
        filePath: bridgeNameToFilePath("IJarvisV6Mint")
    },
]

async function main() {
    const networkName = hre.hardhatArguments.network;

    if (networkName === undefined) {
        console.log('Please set --network :D');
        return;
    }

    const response = await prompts({
        type: 'text',
        name: 'interfaceName',
        message: `Which interface name do you want to generate JSON for?`,
    } )


    const interfaceName = response.interfaceName;
    
    const selectedInterface = interfaces.filter(x => x.interfaceName === interfaceName)[0];

    const contractFile = readFileSync(
        selectedInterface.filePath,
        'utf8')
    const contract = JSON.parse(contractFile);

    const obj = {
        name: selectedInterface.interfaceName,
        networkName: networkName,
        abi: contract.abi,
    };

    console.log(JSON.stringify(obj, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
