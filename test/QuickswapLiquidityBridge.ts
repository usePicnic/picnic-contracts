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

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Add Liquidity - WETH/QUICK LP Token", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                quickswapLiquidityBridge.address,
            ];

            // Set path


            // Set encoded calls
            var _bridgeEncodedCalls = [
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "tradeFromETHToToken",
                    [
                        50000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['WETH']]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "tradeFromETHToToken",
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

            // Transfer money to wallet (similar as IndexPool contract would have done)
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
                uniswapV2SwapBridge.address,
                quickswapLiquidityBridge.address,
            ];

            // Set path


            // Set encoded calls
            var _bridgeEncodedCalls = [
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "tradeFromETHToToken",
                    [
                        50000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['WETH']]
                    ],
                ),
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidityETH",
                    [
                        100000, // uint256 ethPercentage,
                        1, // uint256 minAmountEth,
                        [TOKENS['WETH']], // address[] tokenA,
                        [100000], // uint256[] tokenAPercentage,
                        [1], // uint256[] minAmountA,
                    ],
                ),
            ];

            // Transfer money to wallet (similar as IndexPool contract would have done)
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
            expect(lpTokenBalance).to.be.above(0);
        });
    });
});
