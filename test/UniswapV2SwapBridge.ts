import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";


describe("UniswapV2SwapBridge", function () {
    let owner;
    let other;
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

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    it("tradeFromTokensToETH - Buys DAI", async function () {
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

    it("tradeFromTokensToETH - Buys DAI and then sells DAI", async function () {
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

        // Execute bridge calls (buys DAI on Uniswap)
        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        // Wallet DAI amount should be 0
        let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
        let previousDaiBalance = await dai.balanceOf(wallet.address);
        expect(previousDaiBalance).to.be.above(0);

        // Set path
        pathUniswap = [
            TOKENS['DAI'],
            TOKENS['WMAIN'],
        ];

        // Set encoded calls
        _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromTokensToETH",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    100000,
                    1,
                    pathUniswap
                ],
            ),
        ];

        // Get previous ETH balance
        let previousETHBalance = await ethers.provider.getBalance(wallet.address);

        // Execute bridge calls (sells DAI for ETH)
        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        // Check if DAI balance is 0
        let currentDaiBalance = await dai.balanceOf(wallet.address);
        expect(currentDaiBalance).to.be.equal(0);

        // Check if ETH balance is larger than previous balance
        let currentETHBalance = await ethers.provider.getBalance(wallet.address);
        expect(currentETHBalance).to.be.above(previousETHBalance);
    })

    it("tradeFromTokensToTokens - Buys DAI and then swaps to WMAIN", async function () {
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

        // Execute bridge calls (buys DAI on Uniswap)
        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        // Wallet DAI amount should be 0
        let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
        let previousDaiBalance = await dai.balanceOf(wallet.address);
        expect(previousDaiBalance).to.be.above(0);

        let weth = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["WMAIN"])
        let previousWMAINBalance = await weth.balanceOf(wallet.address);
        expect(previousWMAINBalance).to.be.equal(0);

        // Set path
        pathUniswap = [
            TOKENS['DAI'],
            TOKENS['WMAIN'],
        ];

        // Set encoded calls
        _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromTokensToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    100000,
                    1,
                    pathUniswap
                ],
            ),
        ];

        // Execute bridge calls (sells DAI for ETH)
        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        // Check if DAI balance is 0
        let currentDaiBalance = await dai.balanceOf(wallet.address);
        expect(currentDaiBalance).to.be.equal(0);

        // Check if ETH balance is larger than previous balance
        let currentWMAINBalance = await weth.balanceOf(wallet.address);
        expect(currentWMAINBalance).to.be.above(previousWMAINBalance);
    })
});