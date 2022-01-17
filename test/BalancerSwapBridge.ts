import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import fetch from 'node-fetch';

describe("BalancerSwapBridge", function () {
    let owner;
    let other;
    let BalancerSwapBridge;
    let balancerSwapBridge;
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

        // Instantiate Balancer bridge
        BalancerSwapBridge = await ethers.getContractFactory("BalancerSwapBridge");
        balancerSwapBridge = await BalancerSwapBridge.deploy();

        // Instantiate WMatic bridge
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
                balancerSwapBridge.address,
            ];

            // Set Quickswap path
            let pathUniswap = [
                TOKENS['WMAIN'],
                TOKENS['USDC'],
            ];

            /* TODO: This test ignores the sellAmount of 0x request and just uses 100% of USDC obtained in the previous step as the amount.  
               Will refactor it in order to only use trades in 0x */
            // Get response from 0x API
            let buyToken = TOKENS['WETH'];
            let sellToken = TOKENS['USDC'];
            let sellAmount = 1000000;
            
            let req_0x = await fetch(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${buyToken}&sellToken=${sellToken}&sellAmount=${sellAmount}&includedSources=Balancer_V2`);
            let data_0x = await req_0x.json();

            console.log(req_0x.url);
            //console.log(data_0x);

            let poolId = data_0x.orders[0].fillData.poolId;
            let tokenInAddress = data_0x.orders[0].takerToken;
            let tokenOutAddress = data_0x.orders[0].makerToken;

            console.log("Owner address");
            console.log(owner.address);
            console.log("Wallet address");
            console.log(wallet.address);
            console.log("Balancer bridge address");
            console.log(balancerSwapBridge.address)
            
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
                balancerSwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        poolId,
                        tokenInAddress,
                        tokenOutAddress,
                        "0x",
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