import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";
import { getFirstEvent } from "./utils";

describe("AaveV2DepositBridge", function () {
  let owner;
  let other;
  let uniswapV2SwapBridge;
  let AaveV2DepositBridge;
  let aaveV2DepositBridge;
  let wmaticBridge;
  let wallet;

  const ADDRESSES = constants["POLYGON"];
  const TOKENS = constants["POLYGON"]["TOKENS"];
  const TOKEN_TO_TEST = "USDT";

  beforeEach(async function () {
    // Get 2 signers to enable to test for permission rights
    [owner, other] = await ethers.getSigners();

    // Instantiate Uniswap bridge
    let UniswapV2SwapBridge = await ethers.getContractFactory(
      "QuickswapSwapBridge"
    );
    uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

    // Instantiate Aave bridge
    AaveV2DepositBridge = await ethers.getContractFactory(
      "AaveV2DepositBridge"
    );
    aaveV2DepositBridge = await AaveV2DepositBridge.deploy();

    let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
    wmaticBridge = await WMaticBridge.deploy();

    // Instantiate Wallet
    let Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy();

    // Set bridges addresses
    var _bridgeAddresses = [
      wmaticBridge.address,
      uniswapV2SwapBridge.address,
      aaveV2DepositBridge.address,
    ];

    // Set path
    let pathUniswap = [TOKENS["WMAIN"], TOKENS[TOKEN_TO_TEST]];

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
          [100000, 1, pathUniswap]
      ),
      aaveV2DepositBridge.interface.encodeFunctionData("deposit", [
        TOKENS[TOKEN_TO_TEST],
        100000,
      ]),
    ];

    // Transfer money to wallet (similar as IndexPool contract would have done)
    const transactionHash = await owner.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
    });
    await transactionHash.wait();

    // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
    await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);
  });

  describe("Actions", function () {
    it("Deposit - Buys TOKEN_TO_TEST and then deposits on Aave", async function () {
      // Wallet token amount should be 0
      let token = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        TOKENS[TOKEN_TO_TEST]
      );
      let tokenBalance = await token.balanceOf(wallet.address);
      expect(tokenBalance).to.be.equal(0);

      // Wallet amToken amount should be 0
      let amToken = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        TOKENS[`am${TOKEN_TO_TEST}`]
      );
      let amTokenBalance = await amToken.balanceOf(wallet.address);
      expect(amTokenBalance).to.be.above(0);
    });

    it("Withdraw - Buys from TOKEN_TO_TEST and deposits on Aave, then withdraws from Aave", async function () {
      // Set bridges addresses
      let _bridgeAddresses = [aaveV2DepositBridge.address];

      // Set encoded calls
      let _bridgeEncodedCalls = [
        aaveV2DepositBridge.interface.encodeFunctionData("withdraw", [
          TOKENS[TOKEN_TO_TEST],
          100000,
        ]),
      ];

      await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);

      // Wallet token amount should be 0
      let token = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        TOKENS[TOKEN_TO_TEST]
      );
      let tokenBalance = await token.balanceOf(wallet.address);
      expect(tokenBalance).to.be.above(0);

      // Wallet amToken amount should be 0
      let amToken = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        TOKENS[`am${TOKEN_TO_TEST}`]
      );
      let amTokenBalance = await amToken.balanceOf(wallet.address);
      expect(amTokenBalance).to.be.equal(0);
    });

    it("Harvest - Buys from TOKEN_TO_TEST and deposits on Aave, then withdraws from Aave", async function () {
      // Set bridges addresses
      let _bridgeAddresses = [aaveV2DepositBridge.address];

      // Set encoded calls
      let _bridgeEncodedCalls = [
        aaveV2DepositBridge.interface.encodeFunctionData("withdraw", [
          TOKENS[TOKEN_TO_TEST],
          0,
        ]),
      ];

      await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);

      // Wallet token amount should be 0
      let token = await ethers.getContractAt(
          "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
          TOKENS['WMAIN']
      );
      let tokenBalance = await token.balanceOf(wallet.address);
      expect(tokenBalance).to.be.above(0);
    });
  });
});
