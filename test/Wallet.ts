import { expect } from "chai";
import { ethers } from "hardhat";

import { getFirstEvent } from "./utils";
import constants from "../constants";




describe("Withdraw", function () {
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
                    1,
                    pathUniswap
                ],
            ),
            aaveV2DepositBridge.interface.encodeFunctionData(
                "deposit",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
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

        expect(event.args.value).to.equal(value);
        expect(event.args.wallet).to.equal(wallet.address);
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
        expect(event.args.value).to.equal(value);
        expect(event.args.wallet).to.equal(wallet.address);
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
        // expect(event.args.value).to.equal(value);

        expect(event.args.wallet).to.equal(wallet.address);
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
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['DAI'],
                    100000
                ]
            ),
            aaveV2DepositBridge.interface.encodeFunctionData(
                "withdraw",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['DAI'],
                    ["0x27F8D03b3a2196956ED754baDc28D73be8830A6e"],
                    "0x357D51124f59836DeD84c8a1730D72B749d8BC23",
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
        
        expect(event.args.wallet).to.equal(wallet.address);
        expect(event.args.value).to.equal(ethers.utils.parseEther("1.1"));
        expect(event.args.path).to.eql([ TOKENS['WMAIN'], TOKENS['DAI'] ]);
        expect(event.args.amounts).to.be.an('array');

        event = await getFirstEvent({ address: wallet.address }, AaveV2DepositBridge, 'Deposit');

        // TODO: Check amount
        expect(event.args.wallet).to.equal(wallet.address);
        expect(event.args.asset).to.equal(TOKENS['DAI']);
        // expect(event.args.amount).to.equal(ethers.utils.parseEther("1.1"));

        // TODO: Check amount
        // TODO: Check claimed reward
        event = await getFirstEvent({ address: wallet.address }, AaveV2DepositBridge, 'Withdraw');
        expect(event.args.wallet).to.equal(wallet.address);
        expect(event.args.asset).to.equal(TOKENS['DAI']);
        expect(event.args.assets).to.eql(["0x27F8D03b3a2196956ED754baDc28D73be8830A6e"]);
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
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['DAI'],
                    100000
                ]
            ),
            aaveV2DepositBridge.interface.encodeFunctionData(
                "withdraw",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['DAI'],
                    ["0x27F8D03b3a2196956ED754baDc28D73be8830A6e"],
                    "0x357D51124f59836DeD84c8a1730D72B749d8BC23",
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

    it("Rejects failed bridge call", async function () {
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
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['QUICK'],
                    100000
                ]
            ),
            aaveV2DepositBridge.interface.encodeFunctionData(
                "withdraw",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    TOKENS['QUICK'],
                    [TOKENS['QUICK']],
                    "0x357D51124f59836DeD84c8a1730D72B749d8BC23",
                    100000
                ]
            )
        ];

        let overrides = { value: ethers.utils.parseEther("1.1") };

        await expect(wallet.write(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        )).to.be.revertedWith("WALLET: BRIDGE CALL MUST BE SUCCESSFUL");
    })
});