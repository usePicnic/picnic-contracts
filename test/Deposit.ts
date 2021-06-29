import { expect } from "chai";
import { ethers } from "hardhat";

describe("Deposit", function () {
  let Pool;
  let hardhatPool;
  let owner;
  let oracle;

  const UNI_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
  const UNI_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
  const QUICK_TOKEN = "0x831753DD7087CaC61aB5644b308642cc1c33Dc13";
  const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
  const BASE_ASSET = BigInt(1000000000000000000);


  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    let Oracle = await ethers.getContractFactory("OraclePath");

    oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner);

    // Get the ContractFactory
    Pool = await ethers.getContractFactory("Pool");

    // To deploy our contract, we just have to call Pool.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    hardhatPool = (await Pool.deploy(UNI_ROUTER, oracle.address)).connect(owner)

    await hardhatPool.createIndex(
      [QUICK_TOKEN], // address[] _tokens
      [1000000000],  // uint256[] _allocation,
      [[QUICK_TOKEN, WMATIC]] // paths
    );
  });

   it("Deposits and buys an index of single token", async function () {
    const initialBalance = await owner.getBalance();

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("1.1") };
    const deposit_result = await hardhatPool.deposit(
      0, // _index_id
      [[WMATIC, QUICK_TOKEN]], // paths
      overrides
    );

    expect(await hardhatPool.getTokenBalance(0, QUICK_TOKEN, owner.getAddress())).to.above(0);
    expect(await owner.getBalance()).to.be.below(initialBalance);
  })

  it("Rejects small deposits", async function () {
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[WMATIC, QUICK_TOKEN]]
    )).to.be.revertedWith('MINIMUM DEPOSIT OF 0.001 MATIC');
  })

  it("Rejects big deposits", async function () {
    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("101") };
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[WMATIC, QUICK_TOKEN]], // paths
      overrides
    )).to.be.revertedWith('EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE');  
  })

  it("Rejects wrong path", async function () {
    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("10") };
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[QUICK_TOKEN, WMATIC]], // paths
      overrides
    )).to.be.revertedWith('WRONG PATH: TOKEN NEEDS TO BE PART OF PATH');  
  })

  it("Increase deposit limit", async function () {   
    let overrides = { value: ethers.utils.parseEther("101") };
    await hardhatPool.setMaxDeposit(BigInt(200) * BASE_ASSET);

    await hardhatPool.deposit(
      0, // _index_id
      [[WMATIC, QUICK_TOKEN]], // paths
      overrides
    );

    overrides = { value: ethers.utils.parseEther("201") };
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[WMATIC, QUICK_TOKEN]], // paths
      overrides
    )).to.be.revertedWith('EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE');     
  })
})

