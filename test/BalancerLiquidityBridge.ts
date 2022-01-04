import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

// TODO this bridge is work in progress

describe("BalancerLiquidityBridge", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let wallet;
    let balancerLiquidityBridge;
    let wmaticBridge;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let BalancerLiquidityBridge = await ethers.getContractFactory("BalancerLiquidityBridge");
        balancerLiquidityBridge = await BalancerLiquidityBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Add Liquidity - USDC/TUSD/DAI/USDT Balancer pool", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                balancerLiquidityBridge.address,
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
                        25_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['USDC']]
                    ],
                ),
                // uniswapV2SwapBridge.interface.encodeFunctionData(
                //     "swapTokenToToken",
                //     [
                //         100,
                //         1,
                //         [TOKENS['WMAIN'], TOKENS['TUSD']]
                //     ],
                // ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        10_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['DAI']]
                    ],
                ),                
                // uniswapV2SwapBridge.interface.encodeFunctionData(
                //     "swapTokenToToken",
                //     [
                //         100000,
                //         1,
                //         [TOKENS['WMAIN'], TOKENS['USDT']]
                //     ],
                // ),            
                balancerLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        "0x0d34e5dD4D8f043557145598E4e2dC286B35FD4f", // pool address
                        [TOKENS['USDC'], TOKENS['TUSD'], TOKENS['DAI'], TOKENS['USDT'],], // address[] tokens - should be sorted numerically
                        [100_000, 0, 100_000, 0], // uint256[] percentages
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

            // Wallet LP token amount should be greater than 0
            let lpToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                "0x0d34e5dD4D8f043557145598E4e2dC286B35FD4f")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.above(0);
        });

        it("Remove Liquidity - USDC/TUSD/DAI/USDT Balancer pool", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                balancerLiquidityBridge.address,
                balancerLiquidityBridge.address,
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
                        25_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['USDC']]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        10_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['DAI']]
                    ],
                ),                
                balancerLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        "0x0d34e5dD4D8f043557145598E4e2dC286B35FD4f", // pool address
                        [TOKENS['USDC'], TOKENS['TUSD'], TOKENS['DAI'], TOKENS['USDT'],], // address[] tokens - should be sorted numerically
                        [100_000, 0, 100_000, 0], // uint256[] percentages
                    ],
                ),
                balancerLiquidityBridge.interface.encodeFunctionData(
                    "removeLiquidity",
                    [
                        "0x0d34e5dD4D8f043557145598E4e2dC286B35FD4f", // pool address
                        100_000, // uint256 percentage of LP token out
                        [1, 0, 1, 0], // uint256[] min amounts out
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

            // Wallet LP token amount should be 0
            let lpToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                "0x0d34e5dD4D8f043557145598E4e2dC286B35FD4f")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.eq(0);

            // Received tokens should be greater than 0
            let usdc = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                TOKENS['USDC'])
            let usdcBalance = await usdc.balanceOf(wallet.address);
            expect(usdcBalance).to.be.above(0);

            let dai = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                TOKENS['DAI'])
            let daiBalance = await dai.balanceOf(wallet.address);
            expect(daiBalance).to.be.above(0);

        });        

    });
});
