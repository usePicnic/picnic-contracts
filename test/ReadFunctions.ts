import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

describe("Read", function () {
  let Pool;
  let hardhatPool;
  let owner;
  let oracle;

  const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNI_TOKEN = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Get the ContractFactory
    Pool = await ethers.getContractFactory("Pool");

    let Oracle = await ethers.getContractFactory("OraclePath");

    oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner);

    // To deploy our contract, we just have to call Pool.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    hardhatPool = (await Pool.deploy(UNI_ROUTER, oracle.address)).connect(owner)

    await hardhatPool.create_index(
      [1000000000],  // uint256[] _allocation,
      [UNI_TOKEN], // address[] _tokens
      [[UNI_TOKEN, WETH]] // paths
    );

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("1.") };
    await hardhatPool.deposit(
      0, // _index_id
      [[WETH, UNI_TOKEN]], // paths
      overrides
    );
  });

  it("Get Indexes Creators", async function () {
    let creators = await hardhatPool.get_indexes_creators(
    );
    expect(creators[0]).to.be.equal(await owner.getAddress());
  })

  it("Read - Get Token Balance", async function () {
    let token_balance = await hardhatPool.get_token_balance(
      0, // Index ID
      UNI_TOKEN, // token address
      await owner.getAddress() // owner address
    );
    await expect(token_balance).to.not.equal(0);
  })

  it("Get Index Allocation", async function () {
    let allocation = await hardhatPool.get_index_allocation(
      0 // index id
    );
    expect(allocation[0]).to.not.equal(0);
  })

  it("Get Index Allocation", async function () {
    let allocation = await hardhatPool.get_index_tokens(
      0 // index id
    );
    expect(allocation[0]).to.be.equal(UNI_TOKEN);
  })

  it("Get Index", async function () {
    let index = await hardhatPool.get_index(
      0 // index id
    );
    expect(index['creator']).to.be.equal(await owner.getAddress());
    expect(index['allocation'][0]).to.not.equal(0);
    expect(index['tokens'][0]).to.be.equal(UNI_TOKEN);
  })
})

