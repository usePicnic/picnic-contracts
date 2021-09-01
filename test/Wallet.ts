import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";


describe("Wallet", function () {
    let owner;
    let other;
    let uniswapV2SwapBridge;
    let aaveV2DepositBridge;
    let wallet;

    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        // Instantiate Aave bridge
        let AaveV2DepositBridge = await ethers.getContractFactory("AaveV2DepositBridge");
        aaveV2DepositBridge = await AaveV2DepositBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    it("UseBridges (Buys DAI on Uniswap)", async function () {
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
        await wallet.useBridges(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        // Wallet DAI amount should be 0
        let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
        let daiBalance = await dai.balanceOf(wallet.address);
        expect(daiBalance).to.be.above(0);
    })

    it("Withdraws Ether", async function () {
        // Set bridges addresses and encoded calls
        var _bridgeAddresses = [];
        var _bridgeEncodedCalls = [];

        // Transfer money to wallet (similar as IndexPool contract would have done)
        const transactionHash = await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });
        await transactionHash.wait();

        // Get ETH balance in owner's wallet before calling withdraw
        let previousBalance = await owner.getBalance()

        // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
        await wallet.withdraw(
            {'tokens': [], 'amounts': []},
            100000,
            owner.address
        );

        // Get ETH balance in owner's wallet after calling withdraw
        let currentBalance = await owner.getBalance()

        // Balance after withdrawing should be higher than before
        expect(currentBalance).to.be.above(previousBalance);
    })

    it("Withdraws ERC20 Tokens (after buying DAI)", async function () {
        // STEP 1: Buys DAI
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
        await wallet.useBridges(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        // Instantiate DAI
        let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])).connect(owner);

        // Records DAI balance
        let previousDaiBalance = await dai.balanceOf(owner.address);

        // STEP 2: Withdraws DAI
        await wallet.withdraw(
            {'tokens': [TOKENS['DAI']], 'amounts': [100000]},
            0,
            owner.address
        );

        // Records DAI balance
        let currentDaiBalance = await dai.balanceOf(owner.address);

        // Balance after withdrawing should be higher than before
        expect(currentDaiBalance).to.be.above(previousDaiBalance);
    })

    it("Rejects useBridges from other user", async function () {
        var _bridgeAddresses = [];
        var _bridgeEncodedCalls = [];

        await expect(wallet.connect(other).useBridges(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        )).to.be.revertedWith("WALLET: ONLY THE INDEXPOOL CONTRACT CAN CALL THIS FUNCTION");
    })

    it("Rejects withdrawal from other user", async function () {
        await expect(wallet.connect(other).withdraw(
            {'tokens': [], 'amounts': []},
            0,
            owner.address
        )).to.be.revertedWith("WALLET: ONLY THE INDEXPOOL CONTRACT CAN CALL THIS FUNCTION");
    })

    it("Revert on Aave bridge propagates correctly", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2DepositBridge.address,
            aaveV2DepositBridge.address,
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    100000,
                    1,
                    [
                        TOKENS['WMAIN'],
                        TOKENS['DAI'],
                    ]
                ],
            ),
            aaveV2DepositBridge.interface.encodeFunctionData(
                "deposit",
                [
                    TOKENS['QUICK'],
                    100000
                ]
            ),
            aaveV2DepositBridge.interface.encodeFunctionData(
                "withdraw",
                [
                    TOKENS['QUICK'],
                    100000
                ]
            )
        ];

        // Transfer money to wallet (similar as IndexPool contract would have done)
        const transactionHash = await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });
        await transactionHash.wait();

        await expect(wallet.useBridges(
            _bridgeAddresses,
            _bridgeEncodedCalls
        )).to.be.revertedWith("revert 1"); // revert 1 means no collateral available
    })
});