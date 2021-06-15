import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

describe("Deposit", function () {
  let Pool;
  let hardhatPool;
  let owner;

  const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";

  beforeEach(async function () {
    [owner] = await ethers.getSigners()

    // Get the ContractFactory
    Pool = await ethers.getContractFactory("Pool");

    // To deploy our contract, we just have to call Pool.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    hardhatPool = (await Pool.deploy(UNI_ROUTER)).connect(owner)

    await hardhatPool.create_index(
      [1000000000],  // uint256[] _allocation,
      [UNI_TOKEN] // address[] _tokens
    );
  });

  it("Deposits to an index of single token", async function () {
    const initialBalance = await owner.getBalance();

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("1.1") };
    const deposit_result = await hardhatPool.deposit(
      0, // _index_id
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
      overrides
    );

    // BUY
    await hardhatPool.buy(
      0, // _index_id
    );

    expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.above(0);
    expect(await owner.getBalance()).to.be.below(initialBalance);
  })

  it("Deposits and buys a single token", async function () {
    const initialBalance = await owner.getBalance();

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("1.1") };
    const deposit_result = await hardhatPool.deposit(
      0, // _index_id
      overrides
    );

    // BUY
    await hardhatPool.buy_token(
      UNI_TOKEN, // token address
    );

    expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.above(0);
    expect(await owner.getBalance()).to.be.below(initialBalance);
  })

  // it("Rejects small deposits", async function () {
  //   await hardhatPool.create_index(
  //     [1000000000],  // uint256[] _allocation,
  //     [UNI_TOKEN] // address[] _tokens
  //   );

  //   let overrides = { value: ethers.utils.parseEther("0.009999999999") };

  //   await expect(hardhatPool.deposit(
  //     0, // _index_id
  //     overrides
  //   )).to.be.revertedWith('DEPOSIT NEEDS TO BE AT LEAST 0.01');
  // })
})

