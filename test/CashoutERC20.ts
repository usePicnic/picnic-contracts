import { expect } from "chai";
import { ethers } from "hardhat";

describe("Cash-out ERC20 tokens", function () {
  let Pool;
  let hardhatPool;
  let owner;
  let addr1;
  let oracle;

  const UNI_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
  const UNI_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
  const QUICK_TOKEN = "0x831753DD7087CaC61aB5644b308642cc1c33Dc13";
  const WETH_TOKEN = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
   const USDC_TOKEN = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
   const FISH_TOKEN = "0x3a3Df212b7AA91Aa0402B9035b098891d276572B";
   const TEL_TOKEN = "0xdF7837DE1F2Fa4631D716CF2502f8b230F1dcc32";
   const MOCEAN_TOKEN = "0xAcD7B3D9c10e97d0efA418903C0c7669E702E4C0";
  const MATIC = "0x0000000000000000000000000000000000000000";

  const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

  const tokens = [QUICK_TOKEN, WETH_TOKEN, MATIC]

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    let Oracle = await ethers.getContractFactory("OraclePath");

    oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner);

    Pool = await ethers.getContractFactory("Pool");

    hardhatPool = (await Pool.deploy(UNI_ROUTER, oracle.address)).connect(owner)

    await hardhatPool.createIndex(
      tokens, // address[] _tokens
      tokens.map(() => 1000000000),  // uint256[] _allocation,
      tokens.map(x => [x, WMATIC]), // paths
    );

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("99.") };
    await hardhatPool.deposit(
      0, // _index_id
      tokens.map(x => [WMATIC, x]), // paths
      overrides
    );
  });

  it("Checks if there is positive balance for all tokens", async function () {
    const initialBalance = await owner.getBalance();
    await hardhatPool.cashOutERC20(
      0, // index_id, 
      1000, // shares_pct
    );
    const finalBalance = await owner.getBalance();

    for (var i = 0; i < tokens.length - 1; i++) { // Don't check WMATIC;
      let erc20 = await ethers.getContractAt(
        "IERC20",
        tokens[i],
      );

      let erc20_balance = await erc20.balanceOf(owner.getAddress());
      await expect(erc20_balance).to.be.above(0);
    }

    await expect(finalBalance).to.be.above(initialBalance);
  });

  it("Rejects withdraw of 0.0%", async function () {
    await expect(hardhatPool.cashOutERC20(
      0,   // _index_id
      0, // _sell_pct
    )).to.be.revertedWith("AMOUNT TO CASH OUT IS TOO SMALL");
  });

  it("Rejects withdraw of 100.1%", async function () {
    await expect(hardhatPool.cashOutERC20(
      0,   // _index_id
      1001, // _sell_pct
    )).to.be.revertedWith('INSUFFICIENT FUNDS');
  });

  it("Force cashout by admin", async function () {

    let initialERC20Balances = [];
    let initialERC20BalancesOwner = [];
    let erc20_balance;
    let erc20_balance_owner;

    for (var i = 0; i < tokens.length - 1; i++) { // Don't check WMATIC;
      let erc20 = await ethers.getContractAt(
        "IERC20",
        tokens[i],
      );

      erc20_balance = await erc20.balanceOf(addr1.getAddress());
      initialERC20Balances.push(erc20_balance);

      erc20_balance_owner = await erc20.balanceOf(owner.getAddress());
      initialERC20BalancesOwner.push(erc20_balance_owner);
    }

    let contractAsSigner0 = hardhatPool.connect(addr1);

    await contractAsSigner0.deposit(
      0, // _index_id
      tokens.map(x => [WMATIC, x]), // paths
      { value: ethers.utils.parseEther("10.") }
    );

    await hardhatPool.cashOutERC20Admin(
      addr1.getAddress(), // address user,
      0, // uint256 index_id,
      1000 // uint256 shares_pct
    )

    for (var i = 0; i < tokens.length - 1; i++) { // Don't check WMATIC;
      let erc20 = await ethers.getContractAt("IERC20", tokens[i]);

      erc20_balance = await erc20.balanceOf(addr1.getAddress());
      erc20_balance_owner = await erc20.balanceOf(owner.getAddress());

      await expect(erc20_balance).to.be.above(initialERC20Balances[i]);
      await expect(erc20_balance_owner).to.be.equal(initialERC20BalancesOwner[i]);
    }
  });
})

