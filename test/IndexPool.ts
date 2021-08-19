import {expect} from "chai";
import {ethers} from "hardhat";

import constants from "../constants";
import {BigNumber} from "ethers";

describe("IndexPool", function () {

    let owner;
    let other;
    let provider;
    let IndexPool;
    let indexPool;
    let aaveV2DepositBridge;
    let uniswapV2SwapBridge;
    let uniswapV2Router02;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        [owner, other] = await ethers.getSigners();
        provider = await ethers.getDefaultProvider();

        IndexPool = await ethers.getContractFactory("IndexPool");
        indexPool = (await IndexPool.deploy()).connect(owner);

        let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();
        await uniswapV2SwapBridge.deployed();

        let AaveV2DepositBridge = await ethers.getContractFactory("AaveV2DepositBridge");
        aaveV2DepositBridge = await AaveV2DepositBridge.deploy();
        await aaveV2DepositBridge.deployed();

        uniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", ADDRESSES["UNISWAP_V2_ROUTER"]);

    });

    it("Registers portfolio", async function () {
        // TODO check if this is correctly being stored in events
        await indexPool.registerPortfolio('test');
    });

    it("Mints NFT with empty calls", async function () {
        var _bridgeAddresses = [];
        var _bridgeEncodedCalls = [];

        let overrides = {value: ethers.utils.parseEther("1")};
        await indexPool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        await expect(await indexPool.balanceOf(owner.address)).to.be.above(0);
    })

    it("Mints NFT -> Buys WMATIC from DAI -> Deposits WMATIC in Aave", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
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
            )
        ];

        let overrides = {value: ethers.utils.parseEther("1")};
        await indexPool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        await expect(await indexPool.balanceOf(owner.address)).to.be.above(0);
    })

    it("Mints NFT -> Deposit -> Withdraw (Aave and Uniswap)", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
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
            )
        ];

        let overrides = {value: ethers.utils.parseEther("1")};
        await indexPool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        await expect(await indexPool.balanceOf(owner.address)).to.be.above(0);

        _bridgeAddresses = [
            aaveV2DepositBridge.address,
            uniswapV2SwapBridge.address,
        ];
        _bridgeEncodedCalls = [
            aaveV2DepositBridge.interface.encodeFunctionData(
                "withdraw",
                [
                    TOKENS['DAI'],
                    100000
                ]
            ),
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromTokensToETH",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    100000,
                    1,
                    [
                        TOKENS['DAI'],
                        TOKENS['WMAIN']
                    ]
                ],
            ),
        ];

        const balanceBegin = await owner.getBalance();

        await indexPool.withdrawPortfolio(
            0,
            {'tokens': [], 'amounts': []},
            100000,
            _bridgeAddresses,
            _bridgeEncodedCalls
        );

        const balanceEnd = await owner.getBalance();
        await expect(balanceEnd).to.be.above(balanceBegin);
    })

    it("Mints NFT with 2 calls and deposit in DAI", async function () {
        var overrides = {value: ethers.utils.parseEther("11")};
        let blockNumber = await provider.getBlockNumber();
        let block = await provider.getBlock(blockNumber);

        await uniswapV2Router02.swapExactETHForTokens(
            1,
            [
                TOKENS['WMAIN'],
                TOKENS['DAI'],
            ],
            owner.address,
            block.timestamp + 100000,
            overrides
        )

        let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])).connect(owner);
        let daiBalance = await dai.balanceOf(owner.address);
        await dai.approve(indexPool.address, daiBalance);

        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2DepositBridge.address,
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromTokensToTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    100000, // arbitrary amount
                    1,
                    [
                        TOKENS['DAI'],
                        TOKENS['WMAIN'],
                    ]
                ],
            ),
            aaveV2DepositBridge.interface.encodeFunctionData(
                "deposit",
                [
                    TOKENS['WMAIN'],
                    100000
                ]
            )
        ];

        await indexPool.createPortfolio(
            {'tokens': [TOKENS["DAI"]], 'amounts': [daiBalance]},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        await expect(await indexPool.balanceOf(owner.address)).to.be.above(0);
    })

    it("Mints NFT and then Edits NFT", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
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
            )
        ];

        let overrides = {value: ethers.utils.parseEther("1")};
        await indexPool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        await indexPool.depositPortfolio(
            0,
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        await expect(await indexPool.balanceOf(owner.address)).to.be.above(0);
    })

    it("Rejects other address editing NFT", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
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
            )
        ];

        let overrides = {value: ethers.utils.parseEther("1")};
        await indexPool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        let otherIndexPool = indexPool.connect(other);

        await expect(otherIndexPool.depositPortfolio(
            0,
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        )).to.be.revertedWith("INDEXPOOL: ONLY NFT OWNER CAN CALL THIS FUNCTION");
    })

    it("Rejects very large deposit", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
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
            )
        ];

        let overrides = {value: ethers.utils.parseEther("101")};

        await expect(indexPool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        )).to.be.revertedWith("DEPOSIT ABOVE MAXIMUM AMOUNT (GUARDED LAUNCH)");
    })

    it("Changes max deposit", async function () {

        indexPool.setMaxDeposit(
            ethers.utils.parseEther("1000")
        )

        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
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
            )
        ];

        let overrides = {value: ethers.utils.parseEther("500")};
        await indexPool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        await expect(await indexPool.balanceOf(owner.address)).to.be.above(0);
    })

    it("Rejects not indexpool calling setMaxDeposit", async function () {

        let otherIndexPool = indexPool.connect(other);

        await expect(otherIndexPool.setMaxDeposit(
            ethers.utils.parseEther("101")
        )).to.be.revertedWith("Ownable: caller is not the owner");
    })
})

