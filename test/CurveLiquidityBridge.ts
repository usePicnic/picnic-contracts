import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import fetch from 'node-fetch';

describe("CurveLiquidityBridge", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let wallet;
    let curveLiquidityBridge;
    let wmaticBridge;
    let DefiBasket;
    let defiBasket;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];
    const POOLS = constants['POLYGON']['CURVE_POOLS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        DefiBasket = await ethers.getContractFactory("DeFiBasket");
        defiBasket = await DefiBasket.deploy();

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
        it("Add Liquidity to am3CRV pool, stake LP token, then unstake and remove liquidity", async function () {
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
                        50_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['USDT']]
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
                        POOLS["am3CRV"], // address (of pool)
                        [TOKENS['DAI'], TOKENS['USDC'], TOKENS['USDT']], // address[] tokens - should be sorted according to pool order
                        [100_000, 100_000, 100_000], // uint256[] percentages
                        1, // uint256 minimumLPout
                    ],
                ),
            ];

            // Transfer money to wallet (similar as DeFi Basket contract would have done)
            const transactionHash = await owner.sendTransaction({
                to: wallet.address,
                value: ethers.utils.parseEther("0.05"), // Sends exactly 1 ether
            });
            await transactionHash.wait();

            // Execute bridge calls (buys DAI, USDC, USDT, then deposits in am3CRV and stakes the LP token)
            await wallet.useBridges(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wallet LP token amount should be greater than 0
            let lpToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.above(0);

            // Stake 50% of LP token
            _bridgeAddresses = [
                curveLiquidityBridge.address,
            ];
            _bridgeEncodedCalls = [
                curveLiquidityBridge.interface.encodeFunctionData(
                    "stakeInRewardGauge",
                    [
                        POOLS["am3CRV"], // address (of pool)
                        50_000, // uint256 amount to stake
                    ],
                )                      
            ];

            // Unstake all LP token
            _bridgeAddresses = [
                curveLiquidityBridge.address,
            ];
            _bridgeEncodedCalls = [
                curveLiquidityBridge.interface.encodeFunctionData(
                    "withdrawFromRewardGauge",
                    [
                        POOLS["am3CRV"], // address (of pool)
                        100_000, // uint256 amount to stake
                    ],
                )                      
            ];
            
            // Execute remove liquidity call
            _bridgeAddresses = [
                curveLiquidityBridge.address,
            ];
            _bridgeEncodedCalls = [
                curveLiquidityBridge.interface.encodeFunctionData(
                    "removeLiquidity",
                    [
                        POOLS["am3CRV"], // address (of pool)
                        100_000, // uint256 percentage out
                        [1,1,1], // uint256[] minAmountsOut
                    ],
                )                      
            ];
            await wallet.useBridges(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );            

        });
        
    });
});