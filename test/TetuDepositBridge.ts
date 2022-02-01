import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

describe("TetuDeposit", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let quickswapLiquidityBridge;
    let sushiLiquidityBridge;
    let tetuBridge;
    let wmaticBridge;
    let wallet;

    const TOKENS = constants['POLYGON']['TOKENS'];
    const VAULTS = constants['POLYGON']['TETU_VAULTS'];

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

        let TetuBridge = await ethers.getContractFactory("TetuDepositBridge");
        tetuBridge = await TetuBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {

        it("Deposit in USDC vault then withdraw", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                tetuBridge.address,
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
                        [TOKENS['WMAIN'], TOKENS['USDC']]
                    ],
                ),                           
                tetuBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        VAULTS["USDC"], // pool address
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
            let xToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                VAULTS["USDC"]
            );
            let xTokenBalance = await xToken.balanceOf(wallet.address);
            expect(xTokenBalance).to.be.gt(0);

            // Withdraw to wallet
            await wallet.useBridges(
                [tetuBridge.address],
                [tetuBridge.interface.encodeFunctionData(
                    "withdraw",
                    [
                        VAULTS["USDC"],
                        100_000,
                    ]
                )]
            );
            xTokenBalance = await xToken.balanceOf(wallet.address);
            expect(xTokenBalance).to.be.eq(0);

        });                           

    });
});
