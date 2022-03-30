import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";
import { getFirstEvent } from "./utils";

describe("JarvisV4Mint", function () {
    let owner;
    let other;
    let uniswapV2SwapBridge;
    let JarvisV4MintBridge;
    let jarvisV4MintBridge;
    let wmaticBridge;
    let wallet;

    const ADDRESSES = constants["POLYGON"];
    const TOKENS = constants["POLYGON"]["TOKENS"];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        let UniswapV2SwapBridge = await ethers.getContractFactory(
            "QuickswapSwapBridge"
        );
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        // Instantiate Aave bridge
        JarvisV4MintBridge = await ethers.getContractFactory(
            "JarvisV4MintBridge"
        );
        jarvisV4MintBridge = await JarvisV4MintBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();

    });
    it("Mints jJPY from USDC, then redeems", async function () {
        // Wallet token amount should be 0
        let token = await ethers.getContractAt(
            "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
            TOKENS['jJPY']
        );
        let tokenBalance = await token.balanceOf(wallet.address);
        expect(tokenBalance).to.be.equal(0);

        // Set bridges addresses
        var _bridgeAddresses = [
            wmaticBridge.address,
            uniswapV2SwapBridge.address,
            jarvisV4MintBridge.address,
        ];

        // Set path
        let pathUniswap = [TOKENS["WMAIN"], TOKENS['USDC']];

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
                [100000, 1, pathUniswap]
            ),
            jarvisV4MintBridge.interface.encodeFunctionData("mint", [
                TOKENS['USDC'], // address assetIn,
                100_000, // uint256 percentageIn,
                '0x2076648e2d9d452d55f4252cba9b162a1850db48', // TOKENS['jEUR'],// address assetOut,
                0, // uint256 minAmountOut
            ]),
        ];

        // Transfer money to wallet (similar as DeFi Basket contract would have done)
        const transactionHash = await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });
        await transactionHash.wait();

        // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
        await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);

        tokenBalance = await token.balanceOf(wallet.address);
        expect(tokenBalance).to.be.above(0);

        _bridgeAddresses = [
            jarvisV4MintBridge.address,
        ];

        _bridgeEncodedCalls = [
            jarvisV4MintBridge.interface.encodeFunctionData("redeem", [
                TOKENS['jJPY'], // address assetIn,
                '0x2076648e2d9d452d55f4252cba9b162a1850db48',
                100_000, // uint256 percentageIn,
                TOKENS['USDC'], // TOKENS['jEUR'],// address assetOut,
                0, // uint256 minAmountOut
            ]),
        ]

        await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);

        tokenBalance = await token.balanceOf(wallet.address);
        expect(tokenBalance).to.be.equal(0);
    });
});
