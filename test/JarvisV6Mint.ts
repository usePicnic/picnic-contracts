/* eslint-disable  @typescript-eslint/no-unused-vars */
import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";

describe("JarvisV6Mint", function () {
    let owner;
    let other;
    let uniswapV2SwapBridge;
    let JarvisV6MintBridge;
    let jarvisV6MintBridge;
    let wmaticBridge;
    let wallet;

    const TOKENS = constants["POLYGON"]["TOKENS"];

    const synthereums = [['jAUD',
    '0x36572797Cc569A74731E0738Ef56e3b8ce3F309c',
    '0xCB7F1Ef7246D1497b985f7FC45A1A31F04346133'],
   ['jGBP',
    '0x36d6D1d6249fbC6EBd0fC28fd46C846fB69b9074',
    '0x767058F11800FBA6A682E73A6e79ec5eB74Fac8c'],
   ['jCAD',
    '0x06440a2DA257233790B5355322dAD82C10F0389A',
    '0x8ca194A3b22077359b5732DE53373D4afC11DeE3'],
   ['jCHF',
    '0x8734CF40A402D4191BD4D7a64bEeF12E4c452DeF',
    '0xbD1463F02f61676d53fd183C2B19282BFF93D099'],
   ['jCNY',
    '0x72E7Da7C0dD3C082Dfe8f22343D6AD70286e07bd',
    '0x84526c812D8f6c4fD6C1a5B68713AFF50733E772'],
   ['jCOP',
    '0x1493607042C5725cEf277A83CFC94caA4fc6278F',
    '0xE6d222caAed5F5DD73A9713AC91C95782e80ACBf'],
   ['jEUR',
    '0x65a7b4Ff684C2d08c115D55a4B089bf4E92F5003',
    '0x4e3Decbb3645551B8A19f0eA1678079FCB33fB4c'],
   ['jJPY',
    '0xAEc757BF73cc1f4609a1459205835Dd40b4e3F29',
    '0x8343091F2499FD4b6174A46D067A920a3b851FF9'],
   ['jKRW',
    '0x7aC6515f4772fcB6EEeF978f60D996B21C56089D',
    '0xa22f6bc96f13bcC84dF36109c973d3c0505a067E'],
   ['jMXN',
    '0x25E9F976f5020F6BF2d417b231e5f414b7700E31',
    '0xBD1fe73e1f12bD2bc237De9b626F056f21f86427'],
   ['jNGN',
    '0x63B5891895A57C31d5Ec2a8A5521b6EE67700f9F',
    '0x182C76e977161f703Bb8f111047dF6C43CFaCc56'],
   ['jNZD',
    '0x4FDA1B4b16f5F2535482b91314018aE5A2fda602',
    '0x6b526Daf03B4C47AF2bcc5860B12151823Ff70E0'],
   ['jPHP',
    '0x8aE34663B4622336818e334dC42f92C41eFbfa35',
    '0x486880FB16408b47f928F472f57beC55AC6089d1'],
   ['jPLN',
    '0x166e4B3Ec3F81F32f0863B9cD63621181d6bFED5',
    '0x08E6d1F0c4877Ef2993Ad733Fc6F1D022d0E9DBf'],
   ['jSEK',
    '0xc8442072CF1E131506eaC7df33eA8910e1d5cFDd',
    '0x197E5d6CcfF265AC3E303a34Db360ee1429f5d1A'],
   ['jSGD',
    '0xBE813590e1B191120f5df3343368f8a2F579514C',
    '0xa926db7a4CC0cb1736D5ac60495ca8Eb7214B503']]


    async function testJFiat(assetIn, synthereum) {
        // Wallet token amount should be 0
        let token = await ethers.getContractAt(
            "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
            assetIn
        );
        let tokenBalance = await token.balanceOf(wallet.address);
        expect(tokenBalance).to.be.equal(0);

        // Set bridges addresses
        var _bridgeAddresses = [
            wmaticBridge.address,
            uniswapV2SwapBridge.address,
            jarvisV6MintBridge.address,
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
            jarvisV6MintBridge.address,
        ];

        _bridgeEncodedCalls = [
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
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        let UniswapV2SwapBridge = await ethers.getContractFactory(
            "QuickswapSwapBridge"
        );
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        // Instantiate Aave bridge
        JarvisV6MintBridge = await ethers.getContractFactory(
            "JarvisV6MintBridge"
        );
        jarvisV6MintBridge = await JarvisV6MintBridge.deploy();

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
            const testResult = await testJFiat(synthereum[2], synthereum[1]);
          expect(testResult).to.be.true;
        })
      })
});
