import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import {getFirstEvent} from "./utils";


describe("AaveV2DepositBridge", function () {
    let owner;
    let other;
    let uniswapV2SwapBridge;
    let AaveV2DepositBridge;
    let aaveV2DepositBridge
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        // Instantiate Aave bridge
        AaveV2DepositBridge = await ethers.getContractFactory("AaveV2DepositBridge");
        aaveV2DepositBridge = await AaveV2DepositBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy(owner.address);
    });

    describe("Actions", function () {
        it("Deposit - Buys DAI and then deposits on Aave", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
                aaveV2DepositBridge.address
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
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        TOKENS['DAI'],
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

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wallet DAI amount should be 0
            let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
            let daiBalance = await dai.balanceOf(wallet.address);
            expect(daiBalance).to.be.equal(0);

            // Wallet DAI amount should be 0
            let amDai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["amDAI"])
            let amDaiBalance = await amDai.balanceOf(wallet.address);
            expect(amDaiBalance).to.be.above(0);
        })

        it("Withdraw - Buys DAI and deposits on Aave, then withdraws from Aave", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
                aaveV2DepositBridge.address
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
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        TOKENS['DAI'],
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

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Set bridges addresses
            _bridgeAddresses = [
                aaveV2DepositBridge.address
            ];

            // Set encoded calls
            var _bridgeEncodedCalls = [
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "withdraw",
                    [
                        TOKENS['DAI'],
                        100000
                    ]
                )
            ];

            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wallet DAI amount should be 0
            let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
            let daiBalance = await dai.balanceOf(wallet.address);
            expect(daiBalance).to.be.above(0);

            // Wallet DAI amount should be 0
            let amDai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["amDAI"])
            let amDaiBalance = await amDai.balanceOf(wallet.address);
            expect(amDaiBalance).to.be.equal(0);
        })

        it("Harvests - Buys DAI and deposits on Aave, then harvest WMATIC from Aave", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
                aaveV2DepositBridge.address
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
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        TOKENS['DAI'],
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

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Set bridges addresses
            _bridgeAddresses = [
                aaveV2DepositBridge.address
            ];


            // Wallet WMATIC amount should be 0
            let wmatic = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["WMAIN"])
            let wmaticBalance = await wmatic.balanceOf(wallet.address);
            expect(wmaticBalance).to.be.equal(0);

            // Set encoded calls
            var _bridgeEncodedCalls = [
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "harvest",
                    [
                        TOKENS['DAI'],
                    ]
                )
            ];

            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // WMATIC should be above zero after harvest
            wmaticBalance = await wmatic.balanceOf(wallet.address);
            expect(wmaticBalance).to.be.above(0);
        })
    })

    describe("Events", function () {
        it("Emits Deposit Event", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
                aaveV2DepositBridge.address
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
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        TOKENS['DAI'],
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

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wallet amDAI balance
            let amDai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["amDAI"])
            let amDaiBalance = await amDai.balanceOf(wallet.address);

            // Get Deposit event
            var event = await getFirstEvent({address: wallet.address}, AaveV2DepositBridge, 'Deposit');

            expect(event.args.assetIn).to.be.equal(TOKENS['DAI']);
            expect(event.args.amount).to.be.equal(amDaiBalance);
            expect(event.args.assetOut).to.be.equal(TOKENS['amDAI']);
        })

        it("Emits Withdraw Event", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
                aaveV2DepositBridge.address
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
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        TOKENS['DAI'],
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

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Set bridges addresses
            _bridgeAddresses = [
                aaveV2DepositBridge.address
            ];

            // Set encoded calls
            var _bridgeEncodedCalls = [
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "withdraw",
                    [
                        TOKENS['DAI'],
                        100000
                    ]
                )
            ];

            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wallet amDAI balance
            let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
            let daiBalance = await dai.balanceOf(wallet.address);

            // Get Deposit event
            var event = await getFirstEvent({address: wallet.address}, AaveV2DepositBridge, 'Withdraw');

            expect(event.args.assetIn).to.be.equal(TOKENS['amDAI']);
            expect(event.args.amount).to.be.equal(daiBalance);
            expect(event.args.percentageOut).to.be.equal(100000);
            expect(event.args.assetOut).to.be.equal(TOKENS['DAI']);
        })

        it("Emits Harvest Event", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
                aaveV2DepositBridge.address
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
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "deposit",
                    [
                        TOKENS['DAI'],
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

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Set bridges addresses
            _bridgeAddresses = [
                aaveV2DepositBridge.address
            ];


            // Wallet WMATIC amount should be 0
            let wmatic = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["WMAIN"])
            let wmaticBalance = await wmatic.balanceOf(wallet.address);
            expect(wmaticBalance).to.be.equal(0);

            // Set encoded calls
            var _bridgeEncodedCalls = [
                aaveV2DepositBridge.interface.encodeFunctionData(
                    "harvest",
                    [
                        TOKENS['DAI'],
                    ]
                )
            ];

            await wallet.write(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // WMATIC should be above zero after harvest
            wmaticBalance = await wmatic.balanceOf(wallet.address);

            // Get Deposit event
            var event = await getFirstEvent({address: wallet.address}, AaveV2DepositBridge, 'Harvest');

            expect(event.args.claimedAsset).to.be.equal(TOKENS['WMAIN']);
            expect(event.args.claimedReward).to.be.equal(wmaticBalance);
        })
    })
});