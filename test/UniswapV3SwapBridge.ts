import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import fetch from 'node-fetch';
import {BigNumber} from "ethers";

describe("CurveSwapBridge", function () {
    let owner;
    let other;
    let UniswapV3SwapBridge;
    let uniswapV3SwapBridge;
    let wmaticBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Quickswap bridge
        UniswapV3SwapBridge = await ethers.getContractFactory("UniswapV3SwapBridge");
        uniswapV3SwapBridge = await UniswapV3SwapBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Trade MATIC for WETH", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV3SwapBridge.address,
            ];

            // Get response from 0x API
            let buyToken = TOKENS['WETH'];
            let sellToken = TOKENS['WMAIN'];
            let sellAmount = '1000000000000000000';

            let req_0x = await fetch(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${buyToken}&sellToken=${sellToken}&sellAmount=${sellAmount}&includedSources=Uniswap_V3`);
            let data_0x = await req_0x.json();

            console.log(data_0x.orders[0].fillData)
            let tokenAddressPath = data_0x.orders[0].fillData.tokenAddressPath;
            let uniswapPath = data_0x.orders[0].fillData.uniswapPath;

            // Set encoded calls
            var _bridgeEncodedCalls = [
                wmaticBridge.interface.encodeFunctionData(
                    "wrap",
                    [
                        100_000
                    ],
                ),
                uniswapV3SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        uniswapPath,// bytes calldata encodedCall,
                        tokenAddressPath, // address[] calldata path,
                        100_000, // uint256 amountInPercentage,
                        1 // uint256 minAmountOut)
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