import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

describe("HarvestDeposit", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let quickswapLiquidityBridge;
    let sushiLiquidityBridge;
    let harvest;
    let wmaticBridge;
    let wallet;

    const TOKENS = constants['POLYGON']['TOKENS'];
    const VAULTS = constants['POLYGON']['HARVEST_VAULTS'];
    const POOLS = constants['POLYGON']['HARVEST_POOLS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let QuickswapLiquidityBridge = await ethers.getContractFactory("QuickswapLiquidityBridge");
        quickswapLiquidityBridge = await QuickswapLiquidityBridge.deploy();

        let SushiLiquidityBridge = await ethers.getContractFactory("SushiLiquidityBridge");
        sushiLiquidityBridge = await SushiLiquidityBridge.deploy();        

        let Harvest = await ethers.getContractFactory("HarvestDepositBridge");
        harvest = await Harvest.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {

        it("Deposit in IFARM-QUICK pool", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                quickswapLiquidityBridge.address,
                harvest.address,
            ];

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
                        50_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['iFARM']]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        50_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['QUICK']]
                    ],
                ),                
                quickswapLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [TOKENS['QUICK'], TOKENS['iFARM']],
                        [100_000, 100_000],
                        [1, 1]
                    ],
                ),                
                harvest.interface.encodeFunctionData(
                    "deposit",
                    [
                       VAULTS["IFARM-QUICK"], // vault address (proxy)
                       POOLS["IFARM-QUICK"], // pool address
                       100_000, // percentage in
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

            // Amount of staked token should be above 0
            let pbfToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                POOLS["IFARM-QUICK"])
            let lpTokenBalance = await pbfToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.gt(0);
        });        

        it("Deposit in USDC-ETH pool", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                sushiLiquidityBridge.address,
                harvest.address,
            ];

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
                        50_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['USDC']]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        50_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['WETH']]
                    ],
                ),                
                sushiLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        [TOKENS['USDC'], TOKENS['WETH']],
                        [100_000, 100_000],
                        [1, 1]
                    ],
                ),                
                harvest.interface.encodeFunctionData(
                    "deposit",
                    [
                       VAULTS["USDC-ETH"], // vault address (proxy)
                       POOLS["USDC-ETH"], // pool address
                       100_000, // percentage in
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

            // Amount of staked token should be above 0
            let pbfToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                POOLS["USDC-ETH"])
            let lpTokenBalance = await pbfToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.gt(0);
        });

        it("Deposit in WETH pool", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                harvest.address,
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
                harvest.interface.encodeFunctionData(
                    "deposit",
                    [
                       VAULTS["WETH"], // vault address (proxy)
                       POOLS["WETH"], // pool address
                       100000, // percentage in
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

            // Amount of staked token should be above 0
            let pbfToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                POOLS["WETH"])
            let pbfTokenBalance = await pbfToken.balanceOf(wallet.address);
            expect(pbfTokenBalance).to.be.gt(0);
        });        

        it("Deposit in USDC pool", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                harvest.address,
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
                        [TOKENS['WMAIN'], TOKENS['USDC']]
                    ],
                ),
                harvest.interface.encodeFunctionData(
                    "deposit",
                    [
                       VAULTS["USDC"], // vault address (proxy)
                       POOLS["USDC"], // pool address
                       100000, // percentage in
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

            // Amount of staked token should be above 0
            let pbfToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                POOLS["USDC"])
            let pbfTokenBalance = await pbfToken.balanceOf(wallet.address);
            expect(pbfTokenBalance).to.be.gt(0);
        });

        it("Deposit in DAI pool", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                harvest.address,
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
                        [TOKENS['WMAIN'], TOKENS['DAI']]
                    ],
                ),
                harvest.interface.encodeFunctionData(
                    "deposit",
                    [
                       VAULTS["DAI"], // vault address (proxy)
                       POOLS["DAI"], // pool address
                       100000, // percentage in
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

            // Amount of staked token should be above 0
            let pbfToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                POOLS["DAI"])
            let pbfTokenBalance = await pbfToken.balanceOf(wallet.address);
            expect(pbfTokenBalance).to.be.gt(0);
        });                

    });
});
