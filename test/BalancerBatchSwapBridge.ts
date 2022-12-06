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
    let balancerGauge;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        const UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let BalancerBatchSwap = await ethers.getContractFactory("BalancerBatchSwap");
        balancerLiquidityBridge = await BalancerBatchSwap.deploy();

        let BalancerGauge = await ethers.getContractFactory("BalancerGauge");
        balancerGauge = await BalancerGauge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

        it("Stake to Gauge - Balancer Aave USD", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                balancerLiquidityBridge.address,
                balancerLiquidityBridge.address,
                balancerGauge.address,
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
                        100_000,
                        1,
                        [TOKENS['WMAIN'], TOKENS['DAI']]
                    ],
                ),      
                balancerLiquidityBridge.interface.encodeFunctionData(
                    "batchSwap",                    
                    [
                        "0x178e029173417b1f9c8bc16dcec6f697bc323746000000000000000000000758", // bytes32 poolId, 
                        100_000, // uint256 percentageIn,
                        ["0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", "0x178E029173417b1F9C8bC16DCeC6f697bC323746"],    // address[] calldata assets,
                        1    // int256[] calldata limits                                           
                    ],
                ), 
                balancerLiquidityBridge.interface.encodeFunctionData(
                    "batchSwap",                    
                    [
                        "0x48e6b98ef6329f8f0a30ebb8c7c960330d64808500000000000000000000075b", // bytes32 poolId, 
                        100_000, // uint256 percentageIn,
                        ["0x178E029173417b1F9C8bC16DCeC6f697bC323746", "0x48e6B98ef6329f8f0A30eBB8c7C960330d648085"],    // address[] calldata assets,
                        1    // int256[] calldata limits                                           
                    ],
                ),     
                balancerGauge.interface.encodeFunctionData(
                    "deposit",
                    [
                        "0x48e6B98ef6329f8f0A30eBB8c7C960330d648085",
                        "0x1c514fEc643AdD86aeF0ef14F4add28cC3425306",
                        100_000,
                    ]),
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
                "0x1c514fEc643AdD86aeF0ef14F4add28cC3425306")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.above(0);
        });

   it("Unstake from gauge - Balancer Aave USD", async function () {
    // Set bridges addresses
    var _bridgeAddresses = [
        wmaticBridge.address,
        uniswapV2SwapBridge.address,
        balancerLiquidityBridge.address,
        balancerLiquidityBridge.address,
        balancerGauge.address,
        balancerGauge.address,
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
                100_000,
                1,
                [TOKENS['WMAIN'], TOKENS['DAI']]
            ],
        ),      
        balancerLiquidityBridge.interface.encodeFunctionData(
            "batchSwap",                    
            [
                "0x178e029173417b1f9c8bc16dcec6f697bc323746000000000000000000000758", // bytes32 poolId, 
                100_000, // uint256 percentageIn,
                ["0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", "0x178E029173417b1F9C8bC16DCeC6f697bC323746"],    // address[] calldata assets,
                1    // int256[] calldata limits                                           
            ],
        ), 
        balancerLiquidityBridge.interface.encodeFunctionData(
            "batchSwap",                    
            [
                "0x48e6b98ef6329f8f0a30ebb8c7c960330d64808500000000000000000000075b", // bytes32 poolId, 
                100_000, // uint256 percentageIn,
                ["0x178E029173417b1F9C8bC16DCeC6f697bC323746", "0x48e6B98ef6329f8f0A30eBB8c7C960330d648085"],    // address[] calldata assets,
                1   // int256[] calldata limits                                           
            ],
        ),     
        balancerGauge.interface.encodeFunctionData(
            "deposit",
            [
                "0x48e6B98ef6329f8f0A30eBB8c7C960330d648085",
                "0x1c514fEc643AdD86aeF0ef14F4add28cC3425306",
                100_000,
            ]),
        balancerGauge.interface.encodeFunctionData(
            "withdraw",
            [
                "0x48e6B98ef6329f8f0A30eBB8c7C960330d648085",
                "0x1c514fEc643AdD86aeF0ef14F4add28cC3425306",
                100_000,
            ]),
        balancerLiquidityBridge.interface.encodeFunctionData(
            "batchSwap",                    
            [
                "0x48e6b98ef6329f8f0a30ebb8c7c960330d64808500000000000000000000075b", // bytes32 poolId, 
                100_000, // uint256 percentageIn,
                ["0x48e6B98ef6329f8f0A30eBB8c7C960330d648085", "0x178E029173417b1F9C8bC16DCeC6f697bC323746"],    // address[] calldata assets,
                1   // int256[] calldata limits                                           
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
        "0x178E029173417b1F9C8bC16DCeC6f697bC323746")
    let lpTokenBalance = await lpToken.balanceOf(wallet.address);
    expect(lpTokenBalance).to.be.above(0);
});
});

