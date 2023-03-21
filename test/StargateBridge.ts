import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";

describe("StargateDeposit", function () {
  let owner;
  let other;
  let uniswapV2SwapBridge;
  let stargateBridge;
  let wmaticBridge;
  let wallet;
  let tokenOut;

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
    const StargateBridge = await ethers.getContractFactory(
      "StargateBridge"
    );
    stargateBridge = await StargateBridge.deploy();

    let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
    wmaticBridge = await WMaticBridge.deploy();

    // Instantiate Wallet
    let Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy();

    // Set bridges addresses
    var _bridgeAddresses = [
      wmaticBridge.address,
      uniswapV2SwapBridge.address,
      stargateBridge.address,
    ];

    // Set path
    let pathUniswap = [TOKENS["WMAIN"], TOKENS[TOKEN_TO_TEST]];

    tokenOut = "0x29e38769f23701A2e4A8Ef0492e19dA4604Be62c";

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
      stargateBridge.interface.encodeFunctionData("addLiquidity", [
        100000,
        TOKENS[TOKEN_TO_TEST],
        tokenOut,
        2
      ]),
    ];

    // Transfer money to wallet (similar as DeFi Basket contract would have done)
    const transactionHash = await owner.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("10"), // Sends exactly 1.0 ether
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
        tokenOut
      );
      let amTokenBalance = await amToken.balanceOf(wallet.address);
      expect(amTokenBalance).to.be.above(0);
    });

    it("Withdraw - Buys from TOKEN_TO_TEST and deposits on Aave, then withdraws from Aave", async function () {
      // Set bridges addresses
      let _bridgeAddresses = [stargateBridge.address];

      // Set encoded calls
      let _bridgeEncodedCalls = [
        stargateBridge.interface.encodeFunctionData("removeLiquidity", [
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
        tokenOut
      );
      let amTokenBalance = await amToken.balanceOf(wallet.address);
      expect(amTokenBalance).to.be.equal(0);
    });
    });
});
