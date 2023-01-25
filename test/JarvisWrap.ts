/* eslint-disable  @typescript-eslint/no-unused-vars */
import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";

describe("JarvisWrap", function () {
    let owner;
    let uniswapV2SwapBridge;
    let JarvisV6MintBridge;
    let jarvisV6MintBridge;
    let wmaticBridge;
    let wallet;
    let jarvisWrapBridge;

    const TOKENS = constants["POLYGON"]["TOKENS"];

    const synthereums = [['jBRL',
    '0x30E97dc680Ee97Ff65B5188d34Fb4EA20B38D710',
    '0xf2f77FE7b8e66571E0fca7104c4d670BF1C8d722',
    '0x491a4eB4f1FC3BfF8E1d2FC856a6A46663aD556f',
    '0x737AFfc8096B35aA77310633A5507b1101211352',
    ],
   ]


    async function testJFiat(assetIn, synthereum, wrappedAsset, synthereumWrap) {
        // Wallet token amount should be 0
        let token = await ethers.getContractAt(
            "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
            wrappedAsset
        );
        let tokenBalance = await token.balanceOf(wallet.address);
        expect(tokenBalance).to.be.equal(0);

        // Set bridges addresses
        var _bridgeAddresses = [
            wmaticBridge.address,
            uniswapV2SwapBridge.address,
            jarvisV6MintBridge.address,
            jarvisWrapBridge.address,
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
            jarvisV6MintBridge.interface.encodeFunctionData("mint", [
                synthereum,
                TOKENS['USDC'], // address assetIn,
                100_000, // uint256 percentageIn,
                assetIn, // TOKENS['jEUR'],// address assetOut,
                0, // uint256 minAmountOut
            ]),
            jarvisWrapBridge.interface.encodeFunctionData("unwrap", [
                synthereumWrap,
                assetIn, // address assetIn,
                100_000, // uint256 percentageIn,
                wrappedAsset, // TOKENS['jEUR'],// address assetOut,
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
        console.log({tokenBalance})
        expect(tokenBalance).to.be.above(0);

        _bridgeAddresses = [
            jarvisWrapBridge.address,
            jarvisV6MintBridge.address,
        ];

        _bridgeEncodedCalls = [
            jarvisWrapBridge.interface.encodeFunctionData("wrap", [
                synthereumWrap,
                wrappedAsset, // address assetIn,
                100_000, // uint256 percentageIn,
                assetIn, // TOKENS['jEUR'],// address assetOut,
            ]),
            jarvisV6MintBridge.interface.encodeFunctionData("redeem", [
                synthereum,
                assetIn, // address assetIn,
                100_000, // uint256 percentageIn,
                TOKENS['USDC'], // TOKENS['jEUR'],// address assetOut,
                0, // uint256 minAmountOut
            ]),
        ]

        await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);

        tokenBalance = await token.balanceOf(wallet.address);

        let usdc = await ethers.getContractAt(
            "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
            TOKENS['USDC']
        );
        let usdcBalance = await usdc.balanceOf(wallet.address);
       return tokenBalance == 0 && usdcBalance > 0
    }

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        let UniswapV2SwapBridge = await ethers.getContractFactory(
            "QuickswapSwapBridge"
        );
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        // Instantiate Jarvis Mint bridge
        JarvisV6MintBridge = await ethers.getContractFactory(
            "JarvisV6MintBridge"
        );
        jarvisV6MintBridge = await JarvisV6MintBridge.deploy();

        // Instantiate Jarvis Wrap bridge
        const JarvisWrapBridge = await ethers.getContractFactory(
            "JarvisWrap"
        );
        jarvisWrapBridge = await JarvisWrapBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();

    });
    
    
    // it("Mints jJPY from USDC, then redeems", async function () {
    //     testJFiat("0xAEc757BF73cc1f4609a1459205835Dd40b4e3F29")
    // });

    synthereums.forEach(synthereum => {
        it(`Minting/Reedeming (${synthereum[0]}) thorough synthereum address: ${synthereum[1]}`, async () => {
            const testResult = await testJFiat(synthereum[2], synthereum[1], synthereum[3], synthereum[4]);
          expect(testResult).to.be.true;
        })
      })
});
