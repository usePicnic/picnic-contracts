import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

const hre = require('hardhat');

describe("Withdraw", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let oracle;
    let aaveV2Bridge;
    let uniswapV2SwapBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const tokens = ADDRESSES['TOKENS'];

    beforeEach(async function () {
      let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
      uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();
      await uniswapV2SwapBridge.deployed();

      let AaveV2Bridge = await ethers.getContractFactory("AaveV2Bridge");
      aaveV2Bridge = await AaveV2Bridge.deploy();
      await aaveV2Bridge.deployed();

      let Wallet = await ethers.getContractFactory("Wallet");
      wallet = await Wallet.deploy();
      await wallet.deployed();

      // await expect(wallet.deposit(_bridgeAddresses, _bridgeEncodedCalls))
      //   .to.emit(greeterCaller, 'GREETING')
      //   .withArgs('Hello, Sir Paul McCartney')
    });

    it("Buy DAI on Uniswap and deposit on Aave", async function () {
      var _bridgeAddresses = [
        uniswapV2SwapBridge.address, 
        aaveV2Bridge.address,
      ];
      var _bridgeEncodedCalls = [
        uniswapV2SwapBridge.interface.encodeFunctionData(
          "tradeFromETHtoTokens",
          [
            ADDRESSES['UNISWAP_V2_ROUTER'],
            1,
            [
              ADDRESSES['WMAIN'],
              ADDRESSES['DAI'],
            ]
          ],
        ),
        aaveV2Bridge.interface.encodeFunctionData(
          "deposit",
          [
            ADDRESSES['AAVE_V2_LENDING_POOL'],
            ADDRESSES['DAI'],
          ]
        )
      ];

      let overrides = {value: ethers.utils.parseEther("1.1")};
      const ret = await wallet.deposit(
        _bridgeAddresses,
        _bridgeEncodedCalls,
        overrides
      );
    })

    it("Buy DAI on Uniswap -> Sell DAI on Uniswap", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHtoTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    1,
                    [
                        ADDRESSES['WMAIN'],
                        ADDRESSES['DAI'],
                    ]
                ],
            )
        ];

        let overrides = {value: ethers.utils.parseEther("1.1")};
        const ret = await wallet.deposit(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );

        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromTokensToETH",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    1,
                    [
                        ADDRESSES['DAI'],
                        ADDRESSES['WMAIN'],
                    ]
                ],
            )
        ];

        await wallet.deposit(
            _bridgeAddresses,
            _bridgeEncodedCalls
        );
    })

    it("Buy DAI on Uniswap and deposit on Aave and withdraw on Aave", async function () {
        var _bridgeAddresses = [
            uniswapV2SwapBridge.address,
            aaveV2Bridge.address,
            aaveV2Bridge.address,
        ];
        var _bridgeEncodedCalls = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "tradeFromETHtoTokens",
                [
                    ADDRESSES['UNISWAP_V2_ROUTER'],
                    1,
                    [
                        ADDRESSES['WMAIN'],
                        ADDRESSES['DAI'],
                    ]
                ],
            ),
            aaveV2Bridge.interface.encodeFunctionData(
                "deposit",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    ADDRESSES['DAI'],
                ]
            ),
            aaveV2Bridge.interface.encodeFunctionData(
                "withdraw",
                [
                    ADDRESSES['AAVE_V2_LENDING_POOL'],
                    ADDRESSES['DAI'],
                    ["0x27F8D03b3a2196956ED754baDc28D73be8830A6e"],
                    "0x357D51124f59836DeD84c8a1730D72B749d8BC23"
                ]
            )
        ];

        let overrides = {value: ethers.utils.parseEther("1.1")};
        const ret = await wallet.deposit(
            _bridgeAddresses,
            _bridgeEncodedCalls,
            overrides
        );
    })
});