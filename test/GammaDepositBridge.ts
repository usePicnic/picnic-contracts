import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";


describe("GammaDepositBridge", function () {
    let owner;
    let uniswapV2SwapBridge;
    let gammaDepositBridge;
    let gammaRewardsBridge;
    let wmaticBridge;
    let wallet;

    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner] = await ethers.getSigners();

        // Instantiate Quickswap bridge
        const UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        const GammaDepositBridge = await ethers.getContractFactory("GammaDepositBridge");
        gammaDepositBridge = await GammaDepositBridge.deploy();

        const GammaRewardsBridge = await ethers.getContractFactory("GammaRewardsBridge");
        gammaRewardsBridge = await GammaRewardsBridge.deploy();

        const WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {      
        it("Deposit with USDC/DAI", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                gammaDepositBridge.address,
            ];

            let tokenA = TOKENS['USDC'];
            let tokenB = TOKENS['DAI'];
            let poolAddress = '0x9E31214Db6931727B7d63a0D2b6236DB455c0965';

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
                        59299,
                        1,
                        [TOKENS['WMAIN'], tokenA]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], tokenB]
                    ],
                ),
                gammaDepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        poolAddress, // hypervisor
                        [tokenA, tokenB], // addresses
                        [100_000, 100_000], // percentages
                        [0, 0, 0, 0],  // minAmounts,
                    ],
                )
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

            // Wallet token out amount should be 0
            let tokenOut = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", poolAddress)
            let tokenOutBalance = await tokenOut.balanceOf(wallet.address);
            expect(tokenOutBalance).to.be.above(0);
        })

        it("Deposit and withdraw USDC/DAI", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                gammaDepositBridge.address,
                gammaDepositBridge.address,
            ];

            let tokenA = TOKENS['USDC'];
            let tokenB = TOKENS['DAI'];
            let poolAddress = '0x9E31214Db6931727B7d63a0D2b6236DB455c0965';

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
                        59299,
                        1,
                        [TOKENS['WMAIN'], tokenA]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], tokenB]
                    ],
                ),
                gammaDepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        poolAddress, // hypervisor
                        [tokenA, tokenB], // addresses
                        [100_000, 100_000], // percentages
                        [0, 0, 0, 0],  // minAmounts,
                    ],
                ),
                gammaDepositBridge.interface.encodeFunctionData(
                    "withdraw",
                    [
                        poolAddress, // hypervisor
                        [tokenA, tokenB], // addresses
                        100_000, // percentages
                        [0, 0, 0, 0],  // minAmounts,
                    ],
                )
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

            // Wallet token out amount should be 0
            let token = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", poolAddress)
            let tokenBalance = await token.balanceOf(wallet.address);
            expect(tokenBalance).to.be.equal(0);
        })

        it("Deposit with USDC/DAI and stake", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                gammaDepositBridge.address,
                gammaRewardsBridge.address,
            ];

            let tokenA = TOKENS['USDC'];
            let tokenB = TOKENS['DAI'];
            let poolAddress = '0x9E31214Db6931727B7d63a0D2b6236DB455c0965';

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
                        59299,
                        1,
                        [TOKENS['WMAIN'], tokenA]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], tokenB]
                    ],
                ),
                gammaDepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        poolAddress, // hypervisor
                        [tokenA, tokenB], // addresses
                        [100_000, 100_000], // percentages
                        [0, 0, 0, 0],  // minAmounts,
                    ],
                ),
                gammaRewardsBridge.interface.encodeFunctionData(
                    "stake",
                    [
                        "0x20ec0d06F447d550fC6edee42121bc8C1817b97D", // address rewarderAddress,
                        poolAddress, // address tokenAddress,
                        100_000, // uint256 percentage,
                        10, // uint256 poolId   
                    ],
                )
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

            // Wallet token out amount should be 0
            let tokenOut = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", poolAddress)
            let tokenOutBalance = await tokenOut.balanceOf(wallet.address);
            expect(tokenOutBalance).to.be.equal(0);
        })

        it("Deposit with USDC/DAI and stake/unstake", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
                uniswapV2SwapBridge.address,
                gammaDepositBridge.address,
                gammaRewardsBridge.address,
                gammaRewardsBridge.address,
                gammaRewardsBridge.address,
            ];

            let tokenA = TOKENS['USDC'];
            let tokenB = TOKENS['DAI'];
            let poolAddress = '0x9E31214Db6931727B7d63a0D2b6236DB455c0965';

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
                        59299,
                        1,
                        [TOKENS['WMAIN'], tokenA]
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        [TOKENS['WMAIN'], tokenB]
                    ],
                ),
                gammaDepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        poolAddress, // hypervisor
                        [tokenA, tokenB], // addresses
                        [100_000, 100_000], // percentages
                        [0, 0, 0, 0],  // minAmounts,
                    ],
                ),
                gammaRewardsBridge.interface.encodeFunctionData(
                    "stake",
                    [
                        "0x20ec0d06F447d550fC6edee42121bc8C1817b97D", // address rewarderAddress,
                        poolAddress, // address tokenAddress,
                        100_000, // uint256 percentage,
                        10, // uint256 poolId   
                    ],
                ),
                gammaRewardsBridge.interface.encodeFunctionData(
                    "claimRewards",
                    [
                        "0x20ec0d06F447d550fC6edee42121bc8C1817b97D", // address rewarderAddress,
                        10, // uint256 poolId   
                    ],
                ),
                gammaRewardsBridge.interface.encodeFunctionData(
                    "unstake",
                    [
                        "0x20ec0d06F447d550fC6edee42121bc8C1817b97D", // address rewarderAddress,
                        poolAddress, // address tokenAddress,
                        100_000, // uint256 percentage,
                        10, // uint256 poolId   
                    ],
                )
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

            // Wallet token out amount should be 0
            let tokenOut = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", poolAddress)
            let tokenOutBalance = await tokenOut.balanceOf(wallet.address);
            expect(tokenOutBalance).to.be.above(0);
        })
    })
    
});