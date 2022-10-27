import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import {getFirstEvent} from "./utils";


describe("QuickswapSwapBridge", function () {
    let owner;
    let other;
    let dodoV2SwapBridge;
    let wmaticBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];
    const TOKEN_TO_TEST = "CEL";

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Dodo bridge
        const DodoV2SwapBridge = await ethers.getContractFactory("DodoV2SwapBridge");
        dodoV2SwapBridge = await DodoV2SwapBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("tradeFromTokenToETH - Buys DAI", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                dodoV2SwapBridge.address,
            ];

            // Set encoded calls
            var _bridgeEncodedCalls = [
                wmaticBridge.interface.encodeFunctionData(
                    "wrap",
                    [
                        100000
                    ],
                ),
                dodoV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
                        "0xe4bf2864ebec7b7fdf6eeca9bacae7cdfdaffe78",
                        100000,
                        1,
                        ["0x86c6b5ad7c0df3f44aa146f00b823ee97aae1977"], // address[] memory dodoPairs,
                        0, // uint256 directions,               
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
            let token = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", "0xe4bf2864ebec7b7fdf6eeca9bacae7cdfdaffe78")
            let tokenBalance = await token.balanceOf(wallet.address);
            expect(tokenBalance).to.be.above(0);
        })
    })
});