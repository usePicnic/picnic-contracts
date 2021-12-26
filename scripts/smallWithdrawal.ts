import {ethers} from "hardhat";
import constants from "../constants";
import {BigNumber} from "ethers";
import {MongoClient} from "mongodb";

const weiToString = (wei) => {
    return wei
        .div(
            BigNumber.from(10).pow(14)
        )
        .toNumber() / Math.pow(10, 4);
}

const getDeployedAddress = async (contractName, client) => {
    return (await client
        .db(process.env.MONGODB_DATABASE_NAME)
        .collection('contracts')
        .findOne(
            {
                'name': contractName
            }
        ))['address'];
}

async function main() {
    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    let defibasket = await ethers.getContractAt("DeFiBasket",
        await getDeployedAddress("DeFiBasket", client));

    let uniswapV2SwapBridge = await ethers.getContractAt("QuickswapSwapBridge",
        await getDeployedAddress("QuickswapSwapBridge", client));

    let aaveV2DepositBridge = await ethers.getContractAt("AaveV2DepositBridge",
        await getDeployedAddress("AaveV2DepositBridge", client));

    let wMaticBridge = await ethers.getContractAt("WMaticWrapBridge",
        await getDeployedAddress("WMaticWrapBridge", client));

    const [deployer] = await ethers.getSigners();
    const balanceBegin = await deployer.getBalance();
    console.log("Deploying from:", deployer.address);
    console.log("Account balance:", weiToString(balanceBegin));

    const _bridgeAddresses = [
        aaveV2DepositBridge.address,
        uniswapV2SwapBridge.address,
        wMaticBridge.address,
    ];
    const _bridgeEncodedCalls = [
        aaveV2DepositBridge.interface.encodeFunctionData(
            "withdraw",
            [
                TOKENS['DAI'],
                100000
            ]
        ),
        uniswapV2SwapBridge.interface.encodeFunctionData(
            "swapTokenToToken",
            [
                100000,
                1,
                [
                    TOKENS['DAI'],
                    TOKENS['WMAIN']
                ]
            ],
        ),
        wMaticBridge.interface.encodeFunctionData(
            "unwrap",
            [
                100000
            ],
        ),
    ];

    let startingNonce = await deployer.getTransactionCount();

    await defibasket.withdrawPortfolio(
        0,
        {'tokens': [], 'amounts': []},
        100000,
        _bridgeAddresses,
        _bridgeEncodedCalls,
        {gasLimit: 6000000, nonce:startingNonce}
    );

    console.log("Withdraw succeeded:", weiToString(balanceBegin));
    console.log("Account balance:", weiToString(balanceBegin));

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
