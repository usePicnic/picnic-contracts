import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

import { BINANCE_ADDRESS, BINANCE7_ADDRESS, DAI_RICH_ADDRESS } from '../Constants';

describe("Pool", function () {
  let Pool;
  let hardhatPool;
  let owner;

  const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
  const ONEINCH_TOKEN = "0x111111111117dc0aa78b770fa6a738034120c302";

  beforeEach(async function () {
    owner = await ethers.provider.getSigner(BINANCE_ADDRESS)

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [BINANCE_ADDRESS],
    });

    // Get the ContractFactory
    Pool = await ethers.getContractFactory("Pool");

    // To deploy our contract, we just have to call Pool.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    hardhatPool = (await Pool.deploy(UNI_ROUTER)).connect(owner)

  });

  describe("Deployment", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.
    it("Pool has been deployed", async function () {
      // Checks pool has been deployed to a non-empty address    
      expect(await hardhatPool.address).to.be.properAddress;
    })
    it("Pool starts with an empty indexes array", async function () {
      // Checks pool has been deployed to a non-empty address
      expect(await hardhatPool.get_indexes_length()).to.equal(0);
    })
  });

  describe("Index Creation", function () {
    it("Index creation is reflected on get_indexes_length", async function () {
      await hardhatPool.create_index(
        [1000000000],  // uint256[] _allocation,
        [UNI_TOKEN] // address[] _tokens
      );
      expect(await hardhatPool.get_indexes_length()).to.equal(1);

      await hardhatPool.create_index(
        [1000000000, 1000000000],  // uint256[] _allocation,
        [UNI_TOKEN, ONEINCH_TOKEN] // address[] _tokens
      );
      expect(await hardhatPool.get_indexes_length()).to.equal(2);

    })

    it("Should not create Index with incorrect specifications", async () => {
      await expect(hardhatPool.create_index(
        [1000000000],  // uint256[] _allocation,
        [UNI_TOKEN, ONEINCH_TOKEN] // address[] _tokens
      )).to.be.revertedWith('MISMATCH IN LENGTH BETWEEN TOKENS AND ALLOCATION');
    })

    it("Should not create Index with repeat tokens", async () => {
      await expect(hardhatPool.create_index(
        [1000000000, 1000000000],  // uint256[] _allocation,
        [UNI_TOKEN, UNI_TOKEN] // address[] _tokens
      )).to.be.revertedWith('DUPLICATED TOKENS');
    })
  });
});