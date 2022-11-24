import {expect} from "chai";
import { AbiCoder } from "ethers/lib/utils";
import {ethers} from "hardhat";
import constants from "../constants";

describe("BalancerLiquidityBridge", function () {
    let owner;
    let other;
    let uniswapV2SwapBridge;
    let uniswapV3SwapBridge;
    let wallet;
    let balancerLiquidityBridge;
    let wmaticBridge;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        const UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        const UniswapV3SwapBridge = await ethers.getContractFactory("UniswapV3SwapBridge");
        uniswapV3SwapBridge = await UniswapV3SwapBridge.deploy();

        let BalancerLiquidityBridge = await ethers.getContractFactory("BalancerLiquidityAntiPatternBridge");
        balancerLiquidityBridge = await BalancerLiquidityBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Add Liquidity - WMATIC/stMATIC Balancer pool", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV3SwapBridge.address,
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
                uniswapV3SwapBridge.interface.encodeFunctionData(
                    "swapTokenToTokenWithPool",
                    [
                        "0x59db5eA66958b19641b6891Fc373B44b567ea15C",
                        [TOKENS['WMAIN'], "0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4"],
                        50_000,
                        1,                        
                    ],
                ),                           
                balancerLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        "0x8159462d255C1D24915CB51ec361F700174cD994", // pool address
                        ["0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
                            "0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4",
                            "0x8159462d255C1D24915CB51ec361F700174cD994",], // address[] tokens - should be sorted numerically
                        [100_000, 100_000, 0], // uint256[] percentages
                        1, // uint256 minimumBPTout
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
                "0x8159462d255C1D24915CB51ec361F700174cD994")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.above(0);
        });
   });

   describe("Actions", function () {
    it("Add then removes Liquidity - WMATIC/stMATIC Balancer pool", async function () {
        // Set bridges addresses
        var _bridgeAddresses = [
            wmaticBridge.address,
            uniswapV3SwapBridge.address,
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
            uniswapV3SwapBridge.interface.encodeFunctionData(
                "swapTokenToTokenWithPool",
                [
                    "0x59db5eA66958b19641b6891Fc373B44b567ea15C",
                    [TOKENS['WMAIN'], "0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4"],
                    50_000,
                    1,                        
                ],
            ),                           
            balancerLiquidityBridge.interface.encodeFunctionData(
                "addLiquidity",
                [
                    "0x8159462d255C1D24915CB51ec361F700174cD994", // pool address
                    ["0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
                        "0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4",
                        "0x8159462d255C1D24915CB51ec361F700174cD994",], // address[] tokens - should be sorted numerically
                    [100_000, 100_000, 0], // uint256[] percentages
                    1, // uint256 minimumBPTout
                ],
            ),
            balancerLiquidityBridge.interface.encodeFunctionData(
                "removeLiquidity",
                [
                    "0x8159462d255C1D24915CB51ec361F700174cD994", // poolAddress
                    100_000, // percentageOut
                    ["1","0","0"], // uint256[] calldata minAmountsOut
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
            "0x8159462d255C1D24915CB51ec361F700174cD994")
        let lpTokenBalance = await lpToken.balanceOf(wallet.address);
        expect(lpTokenBalance).to.be.eq(0);
    });
});
});
