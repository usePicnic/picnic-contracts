import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import {getFirstEvent} from "./utils";

// TODO this bridge is work in progress

describe("QuickswapLiquidityBridge", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let wallet;
    let quickswapLiquidityBridge;
    let wmaticBridge;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let QuickswapLiquidityBridge = await ethers.getContractFactory("QuickswapLiquidityBridge");
        quickswapLiquidityBridge = await QuickswapLiquidityBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Add Liquidity - WETH/QUICK LP Token", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                quickswapLiquidityBridge.address,
            ];

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
                        50000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['WETH']]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['QUICK']]
                    ],
                ),
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [TOKENS['WETH'], TOKENS['QUICK'],], // address[] tokens,
                        [100000, 100000,], // uint256[] percentages,
                        [1, 1,], // uint256[] minAmounts
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

            // Wallet DAI amount should be 0
            let lpToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                "0x1Bd06B96dd42AdA85fDd0795f3B4A79DB914ADD5")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.above(0);
        });

        it("Add Liquidity - WETH/WMATIC LP Token", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                quickswapLiquidityBridge.address,
            ];

            // Set minimum amounts
            var minAmountEth = 1;
            var minAmountA = 1;

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
                        50000,
                        minAmountEth,
                        [TOKENS['WMAIN'], TOKENS['WETH']]
                    ],
                ),
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [TOKENS['WETH'], TOKENS['WMAIN'],], // address[] tokens,
                        [100000, 100000,], // uint256[] percentages,
                        [1, 1,], // uint256[] minAmounts
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

            // Wallet liquidity token amount should be above 0
            let lpToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                "0xadbF1854e5883eB8aa7BAf50705338739e558E5b")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.above(0);
        });
        it("Remove Liquidity - WETH/QUICK LP Token", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                quickswapLiquidityBridge.address,
                quickswapLiquidityBridge.address,
            ];

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
                        50000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['WETH']]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['QUICK']]
                    ],
                ),
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [TOKENS['WETH'], TOKENS['QUICK'],], // address[] tokens,
                        [100000, 100000,], // uint256[] percentages,
                        [1, 1,], // uint256[] minAmounts
                    ],
                ),
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "removeLiquidity",
                    [
                        [TOKENS['WETH'], TOKENS['QUICK'],], // address[] tokens,
                        100000, // uint256[] percentages,
                        [1, 1,], // uint256[] minAmounts
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

            // Wallet DAI amount should be 0
            let lpToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                "0x1Bd06B96dd42AdA85fDd0795f3B4A79DB914ADD5")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.equal(0);

            let weth = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                TOKENS['WETH'])
            let wethBalance = await weth.balanceOf(wallet.address);
            expect(wethBalance).to.be.above(0);

            let quick = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                TOKENS['QUICK'])
            let quickBalance = await quick.balanceOf(wallet.address);
            expect(quickBalance).to.be.above(0);
        });
        it("Remove Liquidity - WETH/WMATIC LP Token", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                quickswapLiquidityBridge.address,
                quickswapLiquidityBridge.address,
            ];

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
                        50000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['WETH']]
                    ],
                ),
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [TOKENS['WETH'], TOKENS['WMAIN'],], // address[] tokens,
                        [100000, 100000,], // uint256[] percentages,
                        [1, 1,], // uint256[] minAmounts
                    ],
                ),
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "removeLiquidity",
                    [
                        [TOKENS['WETH'], TOKENS['WMAIN'],], // address[] tokens,
                        100000, // uint256[] percentages,
                        [1, 1,], // uint256[] minAmounts
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

            // Wallet DAI amount should be 0
            let lpToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                "0xadbF1854e5883eB8aa7BAf50705338739e558E5b")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.equal(0);

            let weth = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                TOKENS['WETH'])
            let wethBalance = await weth.balanceOf(wallet.address);
            expect(wethBalance).to.be.above(0);

            let quick = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                TOKENS['WMAIN'])
            let quickBalance = await quick.balanceOf(wallet.address);
            expect(quickBalance).to.be.above(0);
        });
    });
});
