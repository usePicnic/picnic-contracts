import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

describe("AutofarmDepositBridge", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let quickswapLiquidityBridge;
    let autofarm;
    let wmaticBridge;
    let wallet;

    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let QuickswapLiquidityBridge = await ethers.getContractFactory("QuickswapLiquidityBridge");
        quickswapLiquidityBridge = await QuickswapLiquidityBridge.deploy();

        let Autofarm = await ethers.getContractFactory("AutofarmDepositBridge");
        autofarm = await Autofarm.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Deposit - WETH/QUICK LP Token", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                quickswapLiquidityBridge.address,
                autofarm.address,
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
                autofarm.interface.encodeFunctionData(
                    "deposit",
                    [
                       "0x1Bd06B96dd42AdA85fDd0795f3B4A79DB914ADD5", // address assetIn,
                       100000 // uint256 percentageIn
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
            expect(lpTokenBalance).to.be.equal(0);
        });

        it("Withdraw - WETH/QUICK LP Token", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                quickswapLiquidityBridge.address,
                autofarm.address,
                autofarm.address,
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
                autofarm.interface.encodeFunctionData(
                    "deposit",
                    [
                        "0x1Bd06B96dd42AdA85fDd0795f3B4A79DB914ADD5", // address assetIn,
                        100000 // uint256 percentageIn
                    ],
                ),
                autofarm.interface.encodeFunctionData(
                    "withdraw",
                    [
                        "0x1Bd06B96dd42AdA85fDd0795f3B4A79DB914ADD5", // address assetOut,
                        100000 // uint256 percentageOut
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
    });
});
