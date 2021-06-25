import { expect } from "chai";
import { ethers } from "hardhat";
const hre = require("hardhat");

describe("OraclePath", function () {

  let owner;
  let oracle;

  const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
  const ONEINCH_TOKEN = "0x111111111117dc0aa78b770fa6a738034120c302";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    let Oracle = await ethers.getContractFactory("OraclePath");

    oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner);
  });

  it("Updates Oracle to no effect", async function () {
    let path = [UNI_TOKEN, WETH, ONEINCH_TOKEN];
    oracle.updateOracles(path);

    expect(await oracle.consult(path)).to.be.equal(0);    
  })

  it("Updates Oracle and changes prices", async function () {

    // suppose the current block has a timestamp of 01:00 PM
    await hre.network.provider.send("evm_increaseTime", [10800])
    await hre.network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 

    let path = [UNI_TOKEN, WETH, ONEINCH_TOKEN];
    oracle.updateOracles(path);

    expect(await oracle.consult(path)).to.be.above(0);    
  })
})

