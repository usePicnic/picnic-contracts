import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

describe("HarvestFinanceDepositBridge", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let quickswapLiquidityBridge;
    let harvestFinance;
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

        let HarvestFinance = await ethers.getContractFactory("HarvestFinanceDepositBridge");
        harvestFinance = await HarvestFinance.deploy();

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
                harvestFinance.address,
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
                        [TOKENS['WMAIN'], TOKENS["QUICK"]]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], TOKENS["iFARM"]]
                    ],
                ),
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [TOKENS["QUICK"], TOKENS["iFARM"],], // address[] tokens,
                        [100000, 100000,], // uint256[] percentages,
                        [1, 1,], // uint256[] minAmounts
                    ],
                ),
                harvestFinance.interface.encodeFunctionData(
                    "deposit",
                    [
                        "0xD7668414BfD52DE6d59E16e5f647c9761992C435", // address assetIn,
                        "0x388Aaf7a534E96Ea97beCAb9Ff0914BB10EC18fE", // vaultAddress
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
                "0xD7668414BfD52DE6d59E16e5f647c9761992C435")
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
                harvestFinance.address,
                harvestFinance.address,
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
                        [TOKENS['WMAIN'], TOKENS["QUICK"]]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], TOKENS["iFARM"]]
                    ],
                ),
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [TOKENS["QUICK"], TOKENS["iFARM"],], // address[] tokens,
                        [100000, 100000,], // uint256[] percentages,
                        [1, 1,], // uint256[] minAmounts
                    ],
                ),
                harvestFinance.interface.encodeFunctionData(
                    "deposit",
                    [
                        "0xD7668414BfD52DE6d59E16e5f647c9761992C435", // address assetIn,
                        "0x388Aaf7a534E96Ea97beCAb9Ff0914BB10EC18fE", // vaultAddress
                        100000 // uint256 percentageIn
                    ],
                ),
                harvestFinance.interface.encodeFunctionData(
                    "withdraw",
                    [
                        "0x388Aaf7a534E96Ea97beCAb9Ff0914BB10EC18fE", // vaultAddress,
                        100000 // amountOut
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
                "0xD7668414BfD52DE6d59E16e5f647c9761992C435")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.above(0);
        });
    });
});
