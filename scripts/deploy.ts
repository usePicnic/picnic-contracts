import deployLogic from "./utils/deployLogic";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";

const hre = require("hardhat");
const prompts = require("prompts");

const weiToString = (wei: BigNumber) : number => {
    return wei
        .div(
            BigNumber.from(10).pow(14)
        )
        .toNumber() / Math.pow(10, 4);
}

function bridgeNameToFilePath(protocolName: string, bridgeName: string): string {
    return `./artifacts/contracts/bridges/${protocolName}/${bridgeName}.sol/${bridgeName}.json`;
}

const contractsToDeploy = [
    {
        contractName: "DeFiBasket",
        interfaceName: "IDeFiBasket",
        filePath: "./artifacts/contracts/DeFiBasket.sol/DeFiBasket.json"
    },
    {
        contractName: "TxSimulator",
        interfaceName: "TxSimulator",
        filePath: "./artifacts/contracts/TxSimulator.sol/TxSimulator.json"
    },
    {
        contractName: "AaveV2DepositBridge",
        interfaceName: "IAaveV2Deposit",
        filePath: bridgeNameToFilePath("AaveV2", "AaveV2DepositBridge")
    },
    {
        contractName: "QuickswapSwapBridge",
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("Quickswap", "QuickswapSwapBridge")
    },
    {
        contractName: "QuickswapLiquidityBridge",
        interfaceName: "IUniswapV2Liquidity",
        filePath: bridgeNameToFilePath("Quickswap", "QuickswapLiquidityBridge")
    },
    {
        contractName: "SushiSwapBridge",
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("Sushiswap", "SushiSwapBridge")
    },
    {
        contractName: "SushiLiquidityBridge",
        interfaceName: "IUniswapV2Liquidity",
        filePath: bridgeNameToFilePath("Sushiswap", "SushiLiquidityBridge")
    },
    {
        contractName: "AutofarmDepositBridge",
        interfaceName: "IAutofarmDeposit",
        filePath: bridgeNameToFilePath("Autofarm", "AutofarmDepositBridge")
    },
    {
        contractName: "WMaticWrapBridge",
        interfaceName: "IWMaticWrap",
        filePath: bridgeNameToFilePath("WMatic", "WMaticWrapBridge")
    },
    {
        contractName: "BalancerSwapBridge",
        interfaceName: "IBalancerSwap",
        filePath: bridgeNameToFilePath("Balancer", "BalancerSwapBridge")
    },
    {
        contractName: "BalancerLiquidityBridge",
        interfaceName: "IBalancerLiquidity",
        filePath: bridgeNameToFilePath("Balancer", "BalancerLiquidityBridge")
    },
    {
        contractName: "ApeSwapBridge",
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("ApeSwap", "ApeSwapBridge")
    },
    {
        contractName: "ApeLiquidityBridge",
        interfaceName: "IUniswapV2Liquidity",
        filePath: bridgeNameToFilePath("ApeSwap", "ApeLiquidityBridge")
    },
    {
        contractName: "DinoSwapBridge",
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("DinoSwap", "DinoSwapBridge")
    },
    {
        contractName: "DinoLiquidityBridge",
        interfaceName: "IUniswapV2Liquidity",
        filePath: bridgeNameToFilePath("DinoSwap", "DinoLiquidityBridge")
    },
    {
        contractName: "DfynSwapBridge",
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("Dfyn", "DfynSwapBridge")
    },
    {
        contractName: "DfynLiquidityBridge",
        interfaceName: "IUniswapV2Liquidity",
        filePath: bridgeNameToFilePath("Dfyn", "DfynLiquidityBridge")
    },
    {
        contractName: "HarvestDepositBridge",
        interfaceName: "IHarvestDeposit",
        filePath: bridgeNameToFilePath("Harvest", "HarvestDepositBridge")
    },
    {
        contractName: "CurveLiquidityBridge",
        interfaceName: "ICurveLiquidity",
        filePath: bridgeNameToFilePath("Curve", "CurveLiquidityBridge")
    },
    {
        contractName: "CurveSwapBridge",
        interfaceName: "ICurveSwap",
        filePath: bridgeNameToFilePath("Curve", "CurveSwapBridge")
    },
    {
        contractName: "UniswapV3SwapBridge",
        interfaceName: "IUniswapV3Swap",
        filePath: bridgeNameToFilePath("UniswapV3", "UniswapV3SwapBridge")
    },
    {
        contractName: "KyberSwapBridge",
        interfaceName: "IKyberSwap",
        filePath: bridgeNameToFilePath("Kyber", "KyberSwapBridge")
    },
    {
        contractName: "KyberLiquidityBridge",
        interfaceName: "IKyberLiquidity",
        filePath: bridgeNameToFilePath("Kyber", "KyberLiquidityBridge")
    },
    {
        contractName: "JarvisV4MintBridge",
        interfaceName: "IJarvisV4Mint",
        filePath: bridgeNameToFilePath("JarvisV4", "JarvisV4MintBridge")
    },
    {
        contractName: "JarvisV6MintBridge",
        interfaceName: "IJarvisV6Mint",
        filePath: bridgeNameToFilePath("JarvisV6", "JarvisV6MintBridge")
    },
    {
        contractName: "MMFSwapBridge",
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("MMF", "MMFSwapBridge")
    },
    {
        contractName: "MeshSwapBridge",
        interfaceName: "IUniswapV2Swap",
        filePath: bridgeNameToFilePath("Mesh", "MeshSwapBridge")
    },
    {
        contractName: "DodoV2SwapBridge",
        interfaceName: "IDodoV2Swap",
        filePath: bridgeNameToFilePath("DodoV2", "DodoV2SwapBridge")
    },
    {
        contractName: "ClearpoolDepositBridge",
        interfaceName: "IClearpoolDepositBridge",
        filePath: bridgeNameToFilePath("Clearpool", "ClearpoolDepositBridge")
    },
    {
        contractName: "JarvisRewards",
        interfaceName: "IJarvisRewards",
        filePath: bridgeNameToFilePath("JarvisRewards", "JarvisRewards")
    }
]

async function main() {
    const networkName = hre.hardhatArguments.network;

    if (networkName === undefined) {
        console.log('Please set --network :D');
        return;
    }

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const balanceBegin = await deployer.getBalance();
    console.log("Account balance:", weiToString(balanceBegin));

    let startingNonce = await deployer.getTransactionCount();
    console.log('Starting nonce:', startingNonce);

    const response = await prompts({
        type: 'text',
        name: 'contractName',
        message: `Which contract do you want to deploy and generate JSON for?`,
    } )

    const contractName = response.contractName;

    if (!response.contractName) {
        console.log("Aborting");
        return;
    }

    const contractToDeploy = contractsToDeploy.filter(contract => contract.contractName === contractName)[0];

    let nonce = await deployer.getTransactionCount();
    const isOk = await deployLogic({
        networkName: networkName,
        contractName: contractToDeploy.contractName,
        interfaceName: contractToDeploy.interfaceName,
        filePath: contractToDeploy.filePath,
        nonce: nonce
    })

    const balanceEnd = await deployer.getBalance();
    console.log("Account balance:", weiToString(balanceEnd));
    console.log("Cost to deploy:", weiToString(balanceBegin.sub(balanceEnd)));

    if (!isOk) {
        console.log('There was a problem during deployment.')
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
