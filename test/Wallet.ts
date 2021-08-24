import { expect } from "chai";
import { ethers } from "hardhat";

import { getFirstEvent } from "./utils";
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

    it("Buy DAI on Uniswap and deposit on Aave", async function () {

        // Set bridges addresses
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2DepositBridge.address,
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

        // Wallet amDAI amount should greater than 0
        let amDai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["amDAI"])
        let amDaiBalance = await amDai.balanceOf(wallet.address);
        expect(amDaiBalance).to.be.above(0);

        // Get event data
        var event = await getFirstEvent({ address: wallet.address }, UniswapV2SwapBridge, 'TradedFromETHToTokens');

        expect(event.args.path).to.eql(pathUniswap);
        expect(event.args.amounts).to.be.an('array');
    })

    it("Buys DAI on Uniswap -> Sell DAI on Uniswap", async function () {

        // Set bridges addresses
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address
        ];

        // Set path
        var pathUniswap = [
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
            )
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

        // Wallet DAI amount greater than  0
        let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
        let daiBalance = await dai.balanceOf(wallet.address);
        expect(daiBalance).to.be.above(0);

        var event = await getFirstEvent({ address: wallet.address }, UniswapV2SwapBridge, 'TradedFromETHToTokens');

        expect(event.args.path).to.eql(pathUniswap);
        expect(event.args.amounts).to.be.an('array');

        pathUniswap = [
            TOKENS['DAI'],
            TOKENS['WMAIN'],
        ]

        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromTokensToETH",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    100000,
                    1,
                    pathUniswap
                ],
            )
        ];

        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls
        );

        event = await getFirstEvent({ address: wallet.address }, UniswapV2SwapBridge, 'TradedFromTokensToETH');

        // TODO: Need to test value by checking balance
        // TODO: Need to check amount numbers
        expect(event.args.path).to.eql(pathUniswap);
        expect(event.args.amounts).to.be.an('array');
    })

    it("Buys DAI on Uniswap and deposit on Aave and withdraw on Aave", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2DepositBridge.address,
            aaveV2DepositBridge.address,
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
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
                    TOKENS['DAI'],
                    100000
                ]
            ),
            aaveV2DepositBridge.interface.encodeFunctionData(
                "withdraw",
                [
                    TOKENS['DAI'],
                    100000
                ]
            )
        ];

        const transactionHash = await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });

        await transactionHash.wait();

        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        var event = await getFirstEvent({ address: wallet.address }, UniswapV2SwapBridge, 'TradedFromETHToTokens');
        
        // expect(event.args.amounts[0]).to.equal(ethers.utils.parseEther("1"));
        // expect(event.args.path).to.eql([ TOKENS['WMAIN'], TOKENS['DAI'] ]);
        // expect(event.args.amounts).to.be.an('array');

        event = await getFirstEvent({ address: wallet.address }, AaveV2DepositBridge, 'Deposit');

        // TODO: Check amount
        // expect(event.args.asset).to.equal(TOKENS['DAI']);
        // expect(event.args.amount).to.equal(ethers.utils.parseEther("1"));

        // TODO: Check amount
        // TODO: Check claimed reward
        event = await getFirstEvent({ address: wallet.address }, AaveV2DepositBridge, 'Withdraw');
        // expect(event.args.asset).to.equal(TOKENS['DAI']);
    })

    it("Rejects write from other user", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2DepositBridge.address,
            aaveV2DepositBridge.address,
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
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
                    TOKENS['DAI'],
                    100000
                ]
            ),
            aaveV2DepositBridge.interface.encodeFunctionData(
                "withdraw",
                [
                    TOKENS['DAI'],
                    100000
                ]
            )
        ];

        const transactionHash = await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });

        await transactionHash.wait();

        await expect(wallet.connect(other).write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        )).to.be.revertedWith("WALLET: ONLY WALLET OWNER CAN CALL THIS FUNCTION");
    })

    it("Rejects failed withdraw (no collateral available)", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2DepositBridge.address,
            aaveV2DepositBridge.address,
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
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

        const transactionHash = await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });

        await transactionHash.wait();

        await expect(wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        )).to.be.revertedWith("revert 1"); // revert 1 means no collateral available
    })
});