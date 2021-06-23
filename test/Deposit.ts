import { expect } from "chai";
import { ethers } from "hardhat";

describe("Deposit", function () {
  let Pool;
  let hardhatPool;
  let owner;

  const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const BASE_ASSET = BigInt(1000000000000000000);


  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Get the ContractFactory
    Pool = await ethers.getContractFactory("Pool");

    // To deploy our contract, we just have to call Pool.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    hardhatPool = (await Pool.deploy(UNI_ROUTER)).connect(owner)

    await hardhatPool.create_index(
      [1000000000],  // uint256[] _allocation,
      [UNI_TOKEN], // address[] _tokens
      [[UNI_TOKEN, WETH]] // paths
    );
  });

  it("Deposits to an index of single token", async function () {
    const initialBalance = await owner.getBalance();

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("1.1") };
    const deposit_result = await hardhatPool.deposit(
      0, // _index_id
      [[WETH, UNI_TOKEN]], // paths
      overrides
    );

    expect(await owner.getBalance()).to.be.below(initialBalance);
  })

  it("Deposits and buys an index of single token", async function () {
    const initialBalance = await owner.getBalance();

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("1.1") };
    const deposit_result = await hardhatPool.deposit(
      0, // _index_id
      [[WETH, UNI_TOKEN]], // paths
      overrides
    );

    expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.above(0);
    expect(await owner.getBalance()).to.be.below(initialBalance);
  })

  it("Rejects small deposits", async function () {
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[WETH, UNI_TOKEN]]
    )).to.be.revertedWith('MINIMUM DEPOSIT OF 0.001 MATIC');
  })

  it("Rejects big deposits", async function () {
    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("101") };
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[WETH, UNI_TOKEN]], // paths
      overrides
    )).to.be.revertedWith('EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE');  
  })

  it("Increase deposit limit", async function () {   
    let overrides = { value: ethers.utils.parseEther("101") };
    await hardhatPool.set_max_deposit(BigInt(200) * BASE_ASSET);

    await hardhatPool.deposit(
      0, // _index_id
      [[WETH, UNI_TOKEN]], // paths
      overrides
    );

    overrides = { value: ethers.utils.parseEther("201") };
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[WETH, UNI_TOKEN]], // paths
      overrides
    )).to.be.revertedWith('EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE');     
  })
})

