import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

const hre = require('hardhat');

describe("Withdraw", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let oracle;
    let uniswapV2SwapBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];
    const tokens = ADDRESSES['TOKENS'];

    beforeEach(async function () {
      let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
      uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();
      await uniswapV2SwapBridge.deployed();

      let Wallet = await ethers.getContractFactory("Wallet");
      wallet = await Wallet.deploy();
      await wallet.deployed();

      // await expect(wallet.deposit(_bridgeAddresses, _bridgeEncodedCalls))
      //   .to.emit(greeterCaller, 'GREETING')
      //   .withArgs('Hello, Sir Paul McCartney')
    });

    it("Single Uniswap buy", async function () {
      var _bridgeAddresses = [uniswapV2SwapBridge.address];
      var _bridgeEncodedCalls = [
        uniswapV2SwapBridge.interface.encodeFunctionData("buy",
        [ ADDRESSES['ROUTER'],
          1,
          [ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]
        ])
      ];

      console.log("bridge addresses");
      console.log(_bridgeAddresses);
      let overrides = {value: ethers.utils.parseEther("1.1")};
      const ret = await wallet.deposit(
        _bridgeAddresses,
        _bridgeEncodedCalls,
        overrides
      );
      console.log(ret);
    })
});