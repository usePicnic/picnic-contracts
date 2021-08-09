import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

const hre = require('hardhat');

describe("Withdraw", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let oracle;
    let aaveV2Bridge;
    let uniswapV2SwapBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const tokens = ADDRESSES['TOKENS'];


    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
        uniswapV2SwapBridge = (await UniswapV2SwapBridge.deploy()).connect(owner);

        let AaveV2Bridge = await ethers.getContractFactory("AaveV2Bridge");
        aaveV2Bridge = (await AaveV2Bridge.deploy()).connect(owner);

        // await expect(wallet.deposit(_bridgeAddresses, _bridgeEncodedCalls))
        //   .to.emit(greeterCaller, 'GREETING')
        //   .withArgs('Hello, Sir Paul McCartney')
    });

    it("Buy DAI on Uniswap and deposit on Aave", async function () {

        let overrides = {value: ethers.utils.parseEther("1.1")};

        await uniswapV2SwapBridge.tradeFromETHToTokens(
            ADDRESSES['UNISWAP_V2_ROUTER'],
            1,
            [
                TOKENS['WMAIN'],
                ADDRESSES['DAI']
            ],
            overrides
        );

        console.log('swap')
        console.log('owner', owner.address)

        let dai = await ethers.getContractAt("IERC20", ADDRESSES['DAI']);
        let balance = await dai.balanceOf(owner.address);
        console.log('dai balance', balance)
        dai.transfer(aaveV2Bridge.address, balance)

        await aaveV2Bridge.deposit(
            ADDRESSES['AAVE_V2_LENDING_POOL'],
            ADDRESSES['DAI'],
        )

        console.log('deposit')

        await aaveV2Bridge.withdraw(
            ADDRESSES['AAVE_V2_LENDING_POOL'],
            ADDRESSES['DAI'],
            ["0x27F8D03b3a2196956ED754baDc28D73be8830A6e"],
            "0x357D51124f59836DeD84c8a1730D72B749d8BC23"
        )

        console.log('withdraw')
    })
});