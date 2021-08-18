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
        [owner, other] = await ethers.getSigners();

        UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();
        await uniswapV2SwapBridge.deployed();

        AaveV2DepositBridge = await ethers.getContractFactory("AaveV2DepositBridge");
        aaveV2DepositBridge = (await AaveV2DepositBridge.deploy()).connect(owner);
        await aaveV2DepositBridge.deployed();

        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = (await Wallet.deploy()).connect(owner);
        await wallet.deployed();
    });

    it("Buy DAI on Uniswap and deposit on Aave", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2DepositBridge.address,
        ];
        let pathUniswap = [
            TOKENS['WMAIN'],
            TOKENS['DAI'],
        ];
        let value = ethers.utils.parseEther("1.1");
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    BigInt(value) * BigInt(999) / BigInt(1000),
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

        let overrides = { value: value };

        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        var event = await getFirstEvent({ address: wallet.address }, UniswapV2SwapBridge, 'TradedFromETHToTokens');

        expect(event.args.path).to.eql(pathUniswap);
        expect(event.args.amounts).to.be.an('array');
    })

    it("Buys DAI on Uniswap -> Sell DAI on Uniswap", async function () {
        var pathUniswap = [
            TOKENS['WMAIN'],
            TOKENS['DAI'],
        ];
        let value = ethers.utils.parseEther("1.1");
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    BigInt(value) * BigInt(999) / BigInt(1000),
                    1,
                    pathUniswap
                ],
            )
        ];

        let overrides = { value: value };
        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

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
                    BigInt(value) / BigInt(10),
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
                    BigInt(ethers.utils.parseEther("1.1") ) * BigInt(999) / BigInt(1000),
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

        let overrides = { value: ethers.utils.parseEther("1.1") };
        await wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        var event = await getFirstEvent({ address: wallet.address }, UniswapV2SwapBridge, 'TradedFromETHToTokens');
        
        // expect(event.args.amounts[0]).to.equal(ethers.utils.parseEther("1.1"));
        // expect(event.args.path).to.eql([ TOKENS['WMAIN'], TOKENS['DAI'] ]);
        // expect(event.args.amounts).to.be.an('array');

        event = await getFirstEvent({ address: wallet.address }, AaveV2DepositBridge, 'Deposit');

        // TODO: Check amount
        // expect(event.args.asset).to.equal(TOKENS['DAI']);
        // expect(event.args.amount).to.equal(ethers.utils.parseEther("1.1"));

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
                    BigInt(ethers.utils.parseEther("1.1") ) * BigInt(999) / BigInt(1000),
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

        let overrides = { value: ethers.utils.parseEther("1.1") };

        await expect(wallet.connect(other).write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
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
                    BigInt(ethers.utils.parseEther("1.1") ) * BigInt(999) / BigInt(1000),
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

        let overrides = { value: ethers.utils.parseEther("1.1") };

        await expect(wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        )).to.be.revertedWith("revert 1"); // revert 1 means no collateral available
    })
});