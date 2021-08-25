import {expect} from "chai";
import {ethers} from "hardhat";

import {getFirstEvent} from "./utils";
import constants from "../constants";


describe("Wallet", function () {
    let owner;
    let other;
    let AaveV2DepositBridge;
    let aaveV2DepositBridge;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();
        await uniswapV2SwapBridge.deployed();

        // Instantiate Aave bridge
        AaveV2DepositBridge = await ethers.getContractFactory("AaveV2DepositBridge");
        aaveV2DepositBridge = (await AaveV2DepositBridge.deploy()).connect(owner);
        await aaveV2DepositBridge.deployed();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = (await Wallet.deploy()).connect(owner);
        await wallet.deployed();
    });

    it("Writes (Buys DAI on Uniswap)", async function () {

        // Set bridges addresses
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
        ];

        // Set path
        let pathUniswap = [
            TOKENS['WMAIN'],
            TOKENS['DAI'],
        ];

        // Set encoded calls
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    100000,
                    1,
                    pathUniswap
                ],
            ),
        ];

        // Transfer money to wallet (similar as IndexPool contract would have done)
        const transactionHash = await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });
        await transactionHash.wait();

        // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        // Wallet DAI amount should be 0
        let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
        let daiBalance = await dai.balanceOf(wallet.address);
        expect(daiBalance).to.be.above(0);
    })

    it("Withdraws Ether", async function () {

        // Set bridges addresses
        var _bridgeAddresses = [];

        // Set encoded calls
        var _bridgeEncodedCalls = [];

        // Transfer money to wallet (similar as IndexPool contract would have done)
        const transactionHash = await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });
        await transactionHash.wait();

        // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
        await wallet.withdraw(
            {'tokens': [], 'amounts': []},
            100000,
            owner.address
        );

        // TODO
        // Wallet DAI amount should be 0
        // let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
        // let daiBalance = await dai.balanceOf(wallet.address);
        // expect(daiBalance).to.be.above(0);
    })

    it("Withdraws ERC20 Tokens", async function () {
        // TODO
        // Set empty bridges addresses and  encoded calls
        var _bridgeAddresses = [];
        var _bridgeEncodedCalls = [];

        // Transfer money to wallet (similar as IndexPool contract would have done)
        const transactionHash = await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });
        await transactionHash.wait();

        // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
        await wallet.withdraw(
            {'tokens': [], 'amounts': []},
            100000,
            owner.address
        );

        // // Wallet DAI amount should be 0
        // let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
        // let daiBalance = await dai.balanceOf(wallet.address);
        // expect(daiBalance).to.be.above(0);
    })

    it("Rejects write from other user", async function () {
        var _bridgeAddresses = [];
        var _bridgeEncodedCalls = [];

        await expect(wallet.connect(other).write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        )).to.be.revertedWith("WALLET: ONLY WALLET OWNER CAN CALL THIS FUNCTION");
    })

    it("Rejects withdrawal from other user", async function () {
        await expect(wallet.connect(other).withdraw(
            {'tokens': [], 'amounts': []},
            0,
            owner.address
        )).to.be.revertedWith("WALLET: ONLY WALLET OWNER CAN CALL THIS FUNCTION");
    })
});