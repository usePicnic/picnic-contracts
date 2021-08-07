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
          "buy",
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
});