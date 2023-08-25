import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";

describe("CompoundV3Bridge", function () {
  let owner;
  let other;
  let UniswapV2SwapBridge;
  let uniswapV2SwapBridge;
  let compoundBridge;
  let wmaticBridge;
  let wallet;
  let usdcContract;

  const TOKENS = constants["POLYGON"]["TOKENS"];

  beforeEach(async function () {
    // Get 2 signers to enable to test for permission rights
    [owner, other] = await ethers.getSigners();

    // Instantiate Uniswap bridge
    UniswapV2SwapBridge = await ethers.getContractFactory(
      "QuickswapSwapBridge"
    );
    uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

    let CompoundBridge = await ethers.getContractFactory("CompoundV3Bridge");
    compoundBridge = await CompoundBridge.deploy();

    let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
    wmaticBridge = await WMaticBridge.deploy();

    // Instantiate Wallet
    let Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy();
  });

  describe("Actions", function () {
    it("Should supply USDC as base token", async function () {
      // Set bridges addresses
      var _bridgeAddresses = [
        wmaticBridge.address,
        uniswapV2SwapBridge.address,
        compoundBridge.address,
      ];

      // Set encoded calls
      var _bridgeEncodedCalls = [
        wmaticBridge.interface.encodeFunctionData("wrap", [100_000]),
        uniswapV2SwapBridge.interface.encodeFunctionData("swapTokenToToken", [
          100_000,
          1,
          [TOKENS["WMAIN"], TOKENS["USDC"]],
        ]),
        compoundBridge.interface.encodeFunctionData("supply", [
          TOKENS["USDC"], // token address // amount in
          100_000, // percentage_in
          "0xf25212e676d1f7f89cd72ffee66158f541246445", // cUSDC address
        ]),
      ];

      // Transfer money to wallet (similar as DeFi Basket contract would have done)
      const transactionHash = await owner.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
      });
      await transactionHash.wait();

      // Execute bridge calls
      await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);

      // Amount of USDC should be 0
      let usdc = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        TOKENS["USDC"]
      );
      let cUSDC = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        "0xf25212e676d1f7f89cd72ffee66158f541246445"
      );
      let usdcBalance = await usdc.balanceOf(wallet.address);
      expect(usdcBalance).to.be.equal(0);

      // Amount of cUSDC should be > 0
      let cUSDCBalance = await cUSDC.balanceOf(wallet.address);
      expect(cUSDCBalance).to.be.above(0);

      // Withdraw cUSDC to wallet as USDC
      await wallet.useBridges(
        [compoundBridge.address],
        [
          compoundBridge.interface.encodeFunctionData("withdraw", [
            TOKENS["USDC"],
            100_000,
            "0xf25212e676d1f7f89cd72ffee66158f541246445",
          ]),
        ]
      );

      cUSDCBalance = await cUSDC.balanceOf(wallet.address);
      usdcBalance = await usdc.balanceOf(wallet.address);
      expect(cUSDCBalance).to.be.equal(0);
      expect(usdcBalance).to.be.above(0);
    });
  });
});
