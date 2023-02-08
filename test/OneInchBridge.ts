import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import {getFirstEvent} from "./utils";

// TODO this bridge is work in progress

describe("QuickswapLiquidityBridge", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let wallet;
    let oneInchBridge;
    let wmaticBridge;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let OneInchBridge = await ethers.getContractFactory("OneInchBridge");
        oneInchBridge = await OneInchBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("One Inch - Altered Swap", async function () {

            const sellAmount = ethers.utils.parseEther("1").toString();
            const fromAddress = "0xee13C86EE4eb1EC3a05E2cc3AB70576F31666b3b";
            const chainId = 137;

                        
            const url = `https://api.1inch.io/v5.0/${chainId}/swap?fromTokenAddress=${TOKENS['WMAIN']}&toTokenAddress=${TOKENS['WETH']}&amount=${sellAmount}&fromAddress=${fromAddress}&slippage=50&disableEstimate=true`;
            const req = await fetch(url);
            const data = await req.json();


            console.log({data})

            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                oneInchBridge.address,
            ];

            // Set encoded calls
            var _bridgeEncodedCalls = [
                wmaticBridge.interface.encodeFunctionData(
                    "wrap",
                    [
                        100000
                    ],
                ),
                oneInchBridge.interface.encodeFunctionData(
                    "swap",
                    [
                        [TOKENS['WETH'], TOKENS['QUICK'],], // address[] tokens,
                        [100000, 100000,], // uint256[] percentages,
                        [1, 1,], // uint256[] minAmounts
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

            // Wallet DAI amount should be 0
            let lpToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                "0x1Bd06B96dd42AdA85fDd0795f3B4A79DB914ADD5")
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.above(0);
        });
    });
});
