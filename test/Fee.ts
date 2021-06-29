import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

describe("Fees", function () {
  let Pool;
  let hardhatPool;
  let owner;
  let addr1;
  let oracle;

  const UNI_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
  const UNI_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
  const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    let Oracle = await ethers.getContractFactory("OraclePath");

    oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner);

    // Get the ContractFactory
    Pool = await ethers.getContractFactory("Pool");

    // To deploy our contract, we just have to call Pool.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    hardhatPool = (await Pool.deploy(UNI_ROUTER, oracle.address)).connect(owner);

    await hardhatPool.createIndex(
      [UNI_TOKEN], // address[] _tokens
      [1000000000],  // uint256[] _allocation,
      [[UNI_TOKEN, WETH]] // PATHS
    );

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("1.") };
    await hardhatPool.deposit(
      0, // _index_id
      [[WETH, UNI_TOKEN]], // Paths
      overrides
    );

    // Preparing to withdraw zero fee
    await hardhatPool.createIndex(
        [UNI_TOKEN], // address[] _tokens
        [1000000000],  // uint256[] _allocation,
      [[UNI_TOKEN, WETH]] // PATHS
    );
  });

  it("Check fee - creator", async function () {
    expect(await hardhatPool.getAvailableCreatorFee(
      0, // Index ID
    )).to.be.equal(ethers.utils.parseEther("0.001"));
  })

  it("Pay fee - creator", async function () {
    const initialBalance = await owner.getBalance();

    await hardhatPool.payCreatorFee(
      0, // Index ID
    );

    expect(await owner.getBalance()).to.be.above(initialBalance);
  })

  it("Rejects creator fee withdraws from other address", async function () {
    let contractAsSigner0 = hardhatPool.connect(addr1);

    await expect(contractAsSigner0.payCreatorFee(
      0, // Index ID
    )).to.be.revertedWith('ONLY INDEX CREATOR CAN WITHDRAW FEES');
  })

  it("Rejects creator withdraw when there is no fee available", async function () {
    await expect(hardhatPool.payCreatorFee(
      1, // Index ID
    )).to.be.revertedWith('NO FEE TO WITHDRAW');
  })

  it("Check fee - protocol", async function () {
    expect(await hardhatPool.getAvailableProtocolFee(
      0, // Index ID
    )).to.be.equal(ethers.utils.parseEther("0.001"));
  })

  it("Pay fee - protocol", async function () {
    const initialBalance = await owner.getBalance();

    await hardhatPool.payProtocolFee(
      0, // Index ID
    );

    expect(await owner.getBalance()).to.be.above(initialBalance);
  })

  it("Rejects protocol fee withdraws from other address", async function () {
    let contractAsSigner0 = hardhatPool.connect(addr1);

    await expect(contractAsSigner0.payProtocolFee(
      0, // Index ID
    )).to.be.revertedWith('ONLY INDEXPOOL CAN CALL THIS FUNCTION');
  })

  it("Rejects creator withdraw when there is no fee available", async function () {
    await expect(hardhatPool.payProtocolFee(
      1, // Index ID
    )).to.be.revertedWith('NO FEE TO WITHDRAW');
  })
})

