import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import fetch from 'node-fetch';
import {BigNumber} from "ethers";

describe("KyberLiquidityBridge", function () {
    let owner;
    let other;
    let uniswapV2SwapBridge;
    let kyberLiquidityBridge;
    let wmaticBridge;
    let wallet;

    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Quickswap bridge
        let UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let KyberLiquidityBridge = await ethers.getContractFactory("KyberLiquidityBridge");
        kyberLiquidityBridge = await KyberLiquidityBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Add and Remove Liquidity with WETH + USDC", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                kyberLiquidityBridge.address,
                kyberLiquidityBridge.address,
            ];

            // Get response from 0x API
            let buyToken = TOKENS['WETH'];
            let sellToken = TOKENS['USDC'];

            let poolAddress = '0xAA5eE78CF79C0ED939FCaAF7Edf94ced176A2F2B';

            let MAX_INT = BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935')

            let vReserve = [0, MAX_INT]

            // Set encoded calls
            var _bridgeEncodedCalls = [
                wmaticBridge.interface.encodeFunctionData(
                    "wrap",
                    [
                        100_000
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        50000,
                        1,
                        [TOKENS['WMAIN'], buyToken]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], sellToken]
                    ],
                ),
                kyberLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [sellToken, buyToken, ], // address[] tokens,
                        poolAddress,
                        [100_000, 100_000], // percentages
                        [1, 1],  // minAmounts,
                        vReserve, // vReserveRatioBounds
                    ],
                ),
                kyberLiquidityBridge.interface.encodeFunctionData(
                    "removeLiquidity",
                    [
                        [sellToken, buyToken, ], // address[] tokens,
                        poolAddress,
                        100_000, // percentage
                        [1, 1],  // minAmounts,
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

        it("Add and Remove Liquidity one-sided with WETH + USDC", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                kyberLiquidityBridge.address,
                kyberLiquidityBridge.address,
            ];

            // Get response from 0x API
            let buyToken = TOKENS['WETH'];
            let sellToken = TOKENS['USDC'];

            let poolAddress = '0xAA5eE78CF79C0ED939FCaAF7Edf94ced176A2F2B';

            let MAX_INT = BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935')

            let vReserve = [0, MAX_INT]

            // Set encoded calls
            var _bridgeEncodedCalls = [
                wmaticBridge.interface.encodeFunctionData(
                    "wrap",
                    [
                        100_000
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        50000,
                        1,
                        [TOKENS['WMAIN'], buyToken]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], sellToken]
                    ],
                ),
                kyberLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [sellToken, buyToken, ], // address[] tokens,
                        poolAddress,
                        [100_000, 100_000], // percentages
                        [1, 1],  // minAmounts,
                        vReserve, // vReserveRatioBounds
                    ],
                ),
                kyberLiquidityBridge.interface.encodeFunctionData(
                    "removeLiquidityOneCoin",
                    [
                        sellToken, // address[] tokens,
                        buyToken,
                        poolAddress,
                        100_000, // percentage
                        1,  // minAmounts,
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