import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";
import {getFirstEvent} from "./utils";


describe("QuickswapSwapBridge", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let wmaticBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();

        var _bridgeAddresses = [
            wmaticBridge.address,
            uniswapV2SwapBridge.address,
        ];

        // Set path
        let pathUniswap = [
            TOKENS['WMAIN'],
            TOKENS['DAI'],
        ];

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
    });

    describe("Actions", function () {
        it("tradeFromETHToToken - Buys DAI", async function () {
            // Wallet DAI amount should be 0
            let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
            let daiBalance = await dai.balanceOf(wallet.address);
            expect(daiBalance).to.be.above(0);
        })

        it("tradeFromTokenToETH - Sells DAI", async function () {
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
                wmaticBridge.address,
            ];

            // Set path
            let pathUniswap = [
                TOKENS['DAI'],
                TOKENS['WMAIN'],
            ];

            // Set encoded calls
            let _bridgeEncodedCalls = [
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        pathUniswap
                    ],
                ),
                wmaticBridge.interface.encodeFunctionData(
                    "unwrap",
                    [
                        100000
                    ],
                ),
            ];

            // Get previous ETH balance
            let previousETHBalance = await ethers.provider.getBalance(wallet.address);

            // Execute bridge calls (sells DAI for ETH)
            await wallet.useBridges(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Check if DAI balance is 0
            let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
            let currentDaiBalance = await dai.balanceOf(wallet.address);
            expect(currentDaiBalance).to.be.equal(0);

            // Check if ETH balance is larger than previous balance
            let currentETHBalance = await ethers.provider.getBalance(wallet.address);
            expect(currentETHBalance).to.be.above(previousETHBalance);
        })

        it("tradeFromTokenToToken - Swaps DAI to WMatic", async function () {
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address
            ];

            // Wallet DAI amount should be 0
            let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
            let previousDaiBalance = await dai.balanceOf(wallet.address);
            expect(previousDaiBalance).to.be.above(0);

            let weth = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["WMAIN"])
            let previousWMAINBalance = await weth.balanceOf(wallet.address);
            expect(previousWMAINBalance).to.be.equal(0);

            // Set path
            let pathUniswap = [
                TOKENS['DAI'],
                TOKENS['WMAIN'],
            ];

            // Set encoded calls
            let _bridgeEncodedCalls = [
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        pathUniswap
                    ],
                ),
            ];

            // Execute bridge calls (sells DAI for ETH)
            await wallet.useBridges(
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
    })
    // describe("Events", function () {
    //     it("Emits TradedFromETHToTokens", async function () {
    //         // Set bridges addresses
    //         var _bridgeAddresses = [
    //             uniswapV2SwapBridge.address,
    //         ];
    //
    //         // Set path
    //         let pathUniswap = [
    //             TOKENS['WMAIN'],
    //             TOKENS['DAI'],
    //         ];
    //
    //         // Set encoded calls
    //         var _bridgeEncodedCalls = [
    //             uniswapV2SwapBridge.interface.encodeFunctionData(
    //                 "swapTokenToToken",
    //                 [
    //                     100000,
    //                     1,
    //                     pathUniswap
    //                 ],
    //             ),
    //         ];
    //
    //         // Transfer money to wallet (similar as IndexPool contract would have done)
    //         const transactionHash = await owner.sendTransaction({
    //             to: wallet.address,
    //             value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
    //         });
    //         await transactionHash.wait();
    //
    //         // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
    //         await wallet.useBridges(
    //             _bridgeAddresses,
    //             _bridgeEncodedCalls,
    //         );
    //
    //         // Get DAI balance on Wallet
    //         let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
    //         let daiBalance = await dai.balanceOf(wallet.address);
    //
    //         // Get Deposit event
    //         var event = await getFirstEvent({address: wallet.address}, UniswapV2SwapBridge, 'TradedFromETHToToken');
    //
    //         expect(event.args.path).to.be.eql(pathUniswap);
    //         expect(event.args.path.length).to.be.equal(2);
    //         expect(event.args.amounts[0]).to.be.equal(ethers.utils.parseEther("1"));
    //         expect(event.args.amounts[1]).to.be.equal(daiBalance);
    //         expect(event.args.amounts.length).to.be.equal(2);
    //     })
    //
    //     it("Emits TradedFromTokensToETH", async function () {
    //         // Set bridges addresses
    //         var _bridgeAddresses = [
    //             uniswapV2SwapBridge.address,
    //         ];
    //
    //         // Set path
    //         let pathUniswap = [
    //             TOKENS['WMAIN'],
    //             TOKENS['DAI'],
    //         ];
    //
    //         // Set encoded calls
    //         var _bridgeEncodedCalls = [
    //             uniswapV2SwapBridge.interface.encodeFunctionData(
    //                 "swapTokenToToken",
    //                 [
    //                     100000,
    //                     1,
    //                     pathUniswap
    //                 ],
    //             ),
    //         ];
    //
    //         // Transfer money to wallet (similar as IndexPool contract would have done)
    //         const transactionHash = await owner.sendTransaction({
    //             to: wallet.address,
    //             value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
    //         });
    //         await transactionHash.wait();
    //
    //         // Execute bridge calls (buys DAI on Uniswap)
    //         await wallet.useBridges(
    //             _bridgeAddresses,
    //             _bridgeEncodedCalls,
    //         );
    //
    //         // Wallet DAI amount should be 0
    //         let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
    //         let previousDaiBalance = await dai.balanceOf(wallet.address);
    //
    //         // Set path
    //         pathUniswap = [
    //             TOKENS['DAI'],
    //             TOKENS['WMAIN'],
    //         ];
    //
    //         // Set encoded calls
    //         _bridgeEncodedCalls = [
    //             uniswapV2SwapBridge.interface.encodeFunctionData(
    //                 "swapTokenToToken",
    //                 [
    //                     100000,
    //                     1,
    //                     pathUniswap
    //                 ],
    //             ),
    //         ];
    //
    //         // Get previous ETH balance
    //         let previousETHBalance = await ethers.provider.getBalance(wallet.address);
    //
    //         // Execute bridge calls (sells DAI for ETH)
    //         await wallet.useBridges(
    //             _bridgeAddresses,
    //             _bridgeEncodedCalls,
    //         );
    //
    //         // Check if ETH balance is larger than previous balance
    //         let currentETHBalance = await ethers.provider.getBalance(wallet.address);
    //
    //         // Get Deposit event
    //         var event = await getFirstEvent({address: wallet.address}, UniswapV2SwapBridge, 'TradedFromTokenToETH');
    //
    //         expect(event.args.path).to.be.eql(pathUniswap);
    //         expect(event.args.path.length).to.be.equal(2);
    //         expect(event.args.amounts[0]).to.be.equal(previousDaiBalance);
    //         expect(event.args.amounts[1]).to.be.equal(currentETHBalance);
    //         expect(event.args.amounts.length).to.be.equal(2);
    //     })
    //
    //     it("Emits TradedFromTokensToTokens", async function () {
    //         // Set bridges addresses
    //         var _bridgeAddresses = [
    //             uniswapV2SwapBridge.address,
    //         ];
    //
    //         // Set path
    //         let pathUniswap = [
    //             TOKENS['WMAIN'],
    //             TOKENS['DAI'],
    //         ];
    //
    //         // Set encoded calls
    //         var _bridgeEncodedCalls = [
    //             uniswapV2SwapBridge.interface.encodeFunctionData(
    //                 "swapTokenToToken",
    //                 [
    //                     100000,
    //                     1,
    //                     pathUniswap
    //                 ],
    //             ),
    //         ];
    //
    //         // Transfer money to wallet (similar as IndexPool contract would have done)
    //         const transactionHash = await owner.sendTransaction({
    //             to: wallet.address,
    //             value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
    //         });
    //         await transactionHash.wait();
    //
    //         // Execute bridge calls (buys DAI on Uniswap)
    //         await wallet.useBridges(
    //             _bridgeAddresses,
    //             _bridgeEncodedCalls,
    //         );
    //
    //         // Wallet DAI amount should be 0
    //         let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
    //         let previousDaiBalance = await dai.balanceOf(wallet.address);
    //         expect(previousDaiBalance).to.be.above(0);
    //
    //         let weth = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["WMAIN"])
    //         let previousWMAINBalance = await weth.balanceOf(wallet.address);
    //         expect(previousWMAINBalance).to.be.equal(0);
    //
    //         // Set path
    //         pathUniswap = [
    //             TOKENS['DAI'],
    //             TOKENS['WMAIN'],
    //         ];
    //
    //         // Set encoded calls
    //         _bridgeEncodedCalls = [
    //             uniswapV2SwapBridge.interface.encodeFunctionData(
    //                 "swapTokenToToken",
    //                 [
    //                     100000,
    //                     1,
    //                     pathUniswap
    //                 ],
    //             ),
    //         ];
    //
    //         // Execute bridge calls (sells DAI for ETH)
    //         await wallet.useBridges(
    //             _bridgeAddresses,
    //             _bridgeEncodedCalls,
    //         );
    //
    //         // Check if DAI balance is 0
    //         let currentDaiBalance = await dai.balanceOf(wallet.address);
    //         expect(currentDaiBalance).to.be.equal(0);
    //
    //         // Check if ETH balance is larger than previous balance
    //         let currentWMAINBalance = await weth.balanceOf(wallet.address);
    //         expect(currentWMAINBalance).to.be.above(previousWMAINBalance);
    //
    //         // Get Deposit event
    //         var event = await getFirstEvent({address: wallet.address}, UniswapV2SwapBridge, 'TradedFromTokenToToken');
    //
    //         expect(event.args.path).to.be.eql(pathUniswap);
    //         expect(event.args.path.length).to.be.equal(2);
    //         expect(event.args.amounts[0]).to.be.equal(previousDaiBalance);
    //         expect(event.args.amounts[1]).to.be.equal(currentWMAINBalance);
    //         expect(event.args.amounts.length).to.be.equal(2);
    //     })
    // })
});

