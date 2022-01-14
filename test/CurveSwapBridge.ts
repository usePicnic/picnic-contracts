import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import fetch from 'node-fetch';

describe("CurveSwapBridge", function () {
    let owner;
    let other;
    let CurveSwapBridge;
    let curveV2SwapBridge;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;    
    let wmaticBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Quickswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();        

        // Instantiate Curve bridge
        CurveSwapBridge = await ethers.getContractFactory("CurveSwapBridge");
        curveV2SwapBridge = await CurveSwapBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Trade WETH for USDC", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                curveV2SwapBridge.address,
            ];

            // Set Quickswap path
            let pathUniswap = [
                TOKENS['WMAIN'],
                TOKENS['USDC'],
            ];

            // Get response from 0x API
            let buyToken = TOKENS['WETH'];
            let sellToken = TOKENS['USDC'];
            let sellAmount = 1000000;

            let req_0x = await fetch(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${buyToken}&sellToken=${sellToken}&sellAmount=${sellAmount}&includedSources=Curve_V2`);
            let data_0x = await req_0x.json();

            console.log(req_0x);
            console.log(data_0x);

            let poolAddress = data_0x.orders[0].fillData.pool.poolAddress;
            let exchangeFunctionSelector = data_0x.orders[0].fillData.pool.exchangeFunctionSelector;
            let fromTokenIdx = data_0x.orders[0].fillData.fromTokenIdx;
            let toTokenIdx = data_0x.orders[0].fillData.toTokenIdx;
            let tokenInAddress = data_0x.orders[0].fillData.pool.tokens[fromTokenIdx];
            let tokenOutAddress = data_0x.orders[0].fillData.pool.tokens[toTokenIdx];
            
            // Set encoded calls
            var _bridgeEncodedCalls = [ 
                wmaticBridge.interface.encodeFunctionData(
                    "wrap",
                    [
                        100000
                    ],
                ),       
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        pathUniswap
                    ],
                ),                         
                curveV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        poolAddress,
                        exchangeFunctionSelector,
                        tokenInAddress,
                        tokenOutAddress,
                        fromTokenIdx,
                        toTokenIdx,
                    ],
                ),
            ];

            // Transfer money to wallet (similar as DeFi Basket contract would have done)
            const transactionHash = await owner.sendTransaction({
                to: wallet.address,
                value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
            });
            await transactionHash.wait();

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            await wallet.useBridges(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wallet token out amount should be 0
            let tokenOut = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", buyToken)
            let tokenOutBalance = await tokenOut.balanceOf(wallet.address);
            expect(tokenOutBalance).to.be.above(0);
        })
    })    
});