import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

describe("CurveLiquidityBridge", function () {
    let owner;
    let other;
    let uniswapV3SwapBridge;
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
        const UniswapV3SwapBridge = await ethers.getContractFactory("UniswapV3SwapBridge");
        uniswapV3SwapBridge = await UniswapV3SwapBridge.deploy();

        const CurveETHLiquidityBridge = await ethers.getContractFactory("CurveETHLiquidityBridge");
        curveLiquidityBridge = await CurveETHLiquidityBridge.deploy();

        const WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("Add Liquidity to MATIC/stMATIC pool and then remove liquidity", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV3SwapBridge.address,
                curveLiquidityBridge.address
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
                        1
                    ],
                ),                                   
                curveLiquidityBridge.interface.encodeFunctionData(
                    "addLiquidity",
                    [
                        "0xFb6FE7802bA9290ef8b00CA16Af4Bc26eb663a28", // address (of pool)
                        ["0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4", TOKENS['WMAIN']], // address[] tokens - should be sorted according to pool order
                        [100_000, 100_000], // uint256[] percentages
                        1, // uint256 minimumLPout
                    ],
                ),
            ];

            // Transfer money to wallet (similar as DeFi Basket contract would have done)
            const transactionHash = await owner.sendTransaction({
                to: wallet.address,
                value: ethers.utils.parseEther("1"), // Sends exactly 1 ether
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
                "0xe7CEA2F6d7b120174BF3A9Bc98efaF1fF72C997d")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            console.log("LP token balance: ", lpTokenBalance.toString());
            expect(lpTokenBalance).to.be.above(0);
            
            // Execute remove liquidity call
            _bridgeAddresses = [
                curveLiquidityBridge.address,
            ];
            _bridgeEncodedCalls = [
                curveLiquidityBridge.interface.encodeFunctionData(
                    "removeLiquidity",
                    [
                        "0xFb6FE7802bA9290ef8b00CA16Af4Bc26eb663a28", // address (of pool)
                        "0xe7CEA2F6d7b120174BF3A9Bc98efaF1fF72C997d",
                        100_000, // uint256 percentage out
                        ["4178803027221422", "10844499631075302"], // uint256[] minAmountsOut
                    ],
                )                      
            ];
            await wallet.useBridges(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );            
            lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.equal(0);
        });        
    });
});