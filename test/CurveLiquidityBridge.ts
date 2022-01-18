import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

describe("CurveLiquidityBridge", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let wallet;
    let curveLiquidityBridge;
    let wmaticBridge;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];
    const POOLS = constants['POLYGON']['CURVE_POOLS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let CurveLiquidityBridge = await ethers.getContractFactory("CurveLiquidityBridge");
        curveLiquidityBridge = await CurveLiquidityBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Add Liquidity to am3CRV pool", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                curveLiquidityBridge.address,
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
                        33_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['USDC']]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        66_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['TUSD']]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['DAI']]
                    ],
                ),                         
                curveLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        POOLS["am3CRV"], // pool address
                        [TOKENS['USDC'], TOKENS['TUSD'], TOKENS['DAI'], TOKENS['USDT'],], // address[] tokens - should be sorted numerically
                        [100_000, 100_000, 100_000], // uint256[] percentages
                        1, // uint256 minimumLPout
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

    });
});
