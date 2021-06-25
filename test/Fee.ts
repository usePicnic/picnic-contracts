import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

describe("Fees", function () {
  let Pool;
  let hardhatPool;
  let owner;
  let addr1;
  let oracle;

  const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
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

    await hardhatPool.create_index(
      [1000000000],  // uint256[] _allocation,
      [UNI_TOKEN], // address[] _tokens
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
    await hardhatPool.create_index(
      [1000000000],  // uint256[] _allocation,
      [UNI_TOKEN], // address[] _tokens
      [[UNI_TOKEN, WETH]] // PATHS
    );
  });

  it("Check fee - creator", async function () {
    expect(await hardhatPool.get_available_creator_fee(
      0, // Index ID
    )).to.be.equal(ethers.utils.parseEther("0.001"));
  })

  it("Pay fee - creator", async function () {
    const initialBalance = await owner.getBalance();

    await hardhatPool.pay_creator_fee(
      0, // Index ID
    );

    expect(await owner.getBalance()).to.be.above(initialBalance);
  })

  it("Rejects creator fee withdraws from other address", async function () {
    let contractAsSigner0 = hardhatPool.connect(addr1);

    await expect(contractAsSigner0.pay_creator_fee(
      0, // Index ID
    )).to.be.revertedWith('ONLY INDEX CREATOR CAN WITHDRAW FEES');
  })

  it("Rejects creator withdraw when there is no fee available", async function () {
    await expect(hardhatPool.pay_creator_fee(
      1, // Index ID
    )).to.be.revertedWith('NO FEE TO WITHDRAW');
  })

  it("Check fee - protocol", async function () {
    expect(await hardhatPool.get_available_protocol_fee(
      0, // Index ID
    )).to.be.equal(ethers.utils.parseEther("0.001"));
  })

  it("Pay fee - protocol", async function () {
    const initialBalance = await owner.getBalance();

    await hardhatPool.pay_protocol_fee(
      0, // Index ID
    );

    expect(await owner.getBalance()).to.be.above(initialBalance);
  })

  it("Rejects protocol fee withdraws from other address", async function () {
    let contractAsSigner0 = hardhatPool.connect(addr1);

    await expect(contractAsSigner0.pay_protocol_fee(
      0, // Index ID
    )).to.be.revertedWith('ONLY INDEXPOOL CAN CALL THIS FUNCTION');
  })

  it("Rejects creator withdraw when there is no fee available", async function () {
    await expect(hardhatPool.pay_protocol_fee(
      1, // Index ID
    )).to.be.revertedWith('NO FEE TO WITHDRAW');
  })
})

