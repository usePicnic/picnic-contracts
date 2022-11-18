import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";

// const MY_ADDRESS = "0xc7D78b1152AE4E7EfeE6C9a476b2F291c49c36A5";
const MY_ADDRESS = "0x02aeE4Ef6548b4E60971919314C20CeD9A093D27";
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const TRANSFER_AMOUNT = 10_000_000;
const POOL_ADDRESS = "0x3f6e10B1ee2882C8278B3e471230e143414cCaa9";
const FACTORY_ADDRESS = "0x215CCa938dF02c9814BE2D39A285B941FbdA79bA";
const PCT_DEPOSIT = 100_000;



describe("Clearpool bridge test", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContract() {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [MY_ADDRESS],
    });

    // Contracts are deployed using the first signer/account by default
    const signer = await ethers.getSigner(MY_ADDRESS);

    const Clearpool = await ethers.getContractFactory("ClearpoolDepositBridge", signer);
    const cp = await Clearpool.deploy();

    return { cp, signer };
  }

  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      const { cp } = await loadFixture(deployContract);

      expect(cp.address).to.be.properAddress;
    });
    it("Should receive USDC", async function () {
      const { cp, signer } = await loadFixture(deployContract);
      const contractInstance = await ethers.getContractAt("IERC20", USDC_ADDRESS, signer);

      await contractInstance.approve(cp.address, TRANSFER_AMOUNT);
      await contractInstance.transfer(cp.address, TRANSFER_AMOUNT);

      // console.log("CP addr", cp.address);
      
      expect(await contractInstance.balanceOf(cp.address)).to.equal(TRANSFER_AMOUNT);
    })
  });
  describe("Transations", function () {
    it("Should deposit 100% to Clearpool's vault", async function () {
      const { cp, signer } = await loadFixture(deployContract);

      const contractInstance = await ethers.getContractAt("IERC20", USDC_ADDRESS, signer);

      await contractInstance.approve(cp.address, TRANSFER_AMOUNT);
      await contractInstance.transfer(cp.address, TRANSFER_AMOUNT);

      expect(await cp.deposit(POOL_ADDRESS, PCT_DEPOSIT))
        .to.emit(cp, "DEFIBASKET_CLEARPOOL_DEPOSIT");
    });

    it("Should withdraw 100% from Clearpool's vault", async function () {
      const { cp, signer } = await loadFixture(deployContract);

      // Depositing USDC
      const contractInstance = await ethers.getContractAt("IERC20", USDC_ADDRESS, signer);
      
      await contractInstance.approve(cp.address, TRANSFER_AMOUNT);
      await contractInstance.transfer(cp.address, TRANSFER_AMOUNT);
      // console.log("Transfer Receipt", transferReceipt);


      // Depositing into Clearpool vault
      await cp.deposit(POOL_ADDRESS, PCT_DEPOSIT);
      // console.log("Deposit Receipt", depositReceipt);

      expect(await cp.withdraw(POOL_ADDRESS, PCT_DEPOSIT))
        .to.emit(cp, "DEFIBASKET_CLEARPOOL_WITHDRAW");
    });

    it("Should claim all the available rewards", async function () {
      const { cp, signer } = await loadFixture(deployContract);

      // Depositing USDC
      const contractInstance = await ethers.getContractAt("IERC20", USDC_ADDRESS, signer);
      
      await contractInstance.approve(cp.address, TRANSFER_AMOUNT);
      await contractInstance.transfer(cp.address, TRANSFER_AMOUNT);
      // console.log("Transfer Receipt", transferReceipt);

      // Depositing into Clearpool vault
      await cp.deposit(POOL_ADDRESS, PCT_DEPOSIT);
      // console.log("Deposit Receipt", depositReceipt);

      expect(await cp.claimRewards(POOL_ADDRESS, FACTORY_ADDRESS))
        .to.emit(cp, "DEFIBASKET_CLEARPOOL_CLAIM");
    });
  });
});