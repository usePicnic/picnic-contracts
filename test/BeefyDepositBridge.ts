import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";

describe("BeefyDepositBridge", function () {
  let owner;
  let other;
  let uniswapV2SwapBridge;
  let beefyDepositBridge;
  let wmaticBridge;
  let wallet;

  const TOKENS = constants["POLYGON"]["TOKENS"];
  const quickVault = "0x1A723371f9dc30653dafd826B60d9335bf867E35";
  
  beforeEach(async function () {
    // Get 2 signers to enable to test for permission rights
    [owner, other] = await ethers.getSigners();

    // Instantiate Uniswap bridge
    let UniswapV2SwapBridge = await ethers.getContractFactory(
      "QuickswapSwapBridge"
    );
    uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

    // Instantiate Aave bridge
    const BeefyDepositBridge = await ethers.getContractFactory(
      "BeefyDepositBridge"
    );
    beefyDepositBridge = await BeefyDepositBridge.deploy();

    const WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
    wmaticBridge = await WMaticBridge.deploy();

    // Instantiate Wallet
    const Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy();

    // Set bridges addresses
    const _bridgeAddresses = [
      wmaticBridge.address,
      uniswapV2SwapBridge.address,
      beefyDepositBridge.address,
    ];

    // Set path
    const pathUniswap = [TOKENS["WMAIN"], TOKENS["QUICK"]];

    // Set encoded calls
    const _bridgeEncodedCalls = [
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
      beefyDepositBridge.interface.encodeFunctionData("deposit", [
        quickVault,
        100000,
      ]),
    ];

    // Transfer money to wallet (similar as DeFi Basket contract would have done)
    const transactionHash = await owner.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
    });
    await transactionHash.wait();

    // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
    await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);
  });

  describe("Actions", function () {
    it("Deposit - Buys QUICK and then deposits on Beefy", async function () {
      // Wallet token amount should be 0
      const token = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        TOKENS["QUICK"]
      );
      const tokenBalance = await token.balanceOf(wallet.address);
      expect(tokenBalance).to.be.equal(0);

      // Wallet amToken amount should be 0
      const amToken = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        quickVault
      );
      const usdcVaultBalance = await amToken.balanceOf(wallet.address);
      expect(usdcVaultBalance).to.be.above(0);
    });
    it("Withdraw - Buys QUICK and then deposits and withdraws on Beefy", async function () {
        const _bridgeAddresses = [
            beefyDepositBridge.address,
          ];
      
        // Set encoded calls
        const _bridgeEncodedCalls = [         
        beefyDepositBridge.interface.encodeFunctionData("withdraw", [
            quickVault,
            100_000,
        ]),
        ];    

        // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
        await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);

        // Wallet token amount should be 0
        const token = await ethers.getContractAt(
          "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
          TOKENS["QUICK"]
        );
        const tokenBalance = await token.balanceOf(wallet.address);
        expect(tokenBalance).to.be.above(0);
  
        // Wallet amToken amount should be 0
        const amToken = await ethers.getContractAt(
          "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
          quickVault
        );
        const quickVaultBalance = await amToken.balanceOf(wallet.address);
        expect(quickVaultBalance).to.be.equal(0);
      });
  });
});
