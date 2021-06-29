import { expect } from "chai";
import { ethers } from "hardhat";
const hre = require("hardhat");

describe("OraclePair", function () {

  let owner;
  let oracle;

  const UNI_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
  const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const SUSHI_TOKEN = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2";


  beforeEach(async function () {
    [owner] = await ethers.getSigners();
  });

  it("Deploys", async function () {
    let Oracle = await ethers.getContractFactory("OraclePair");

    oracle = (await Oracle.deploy(UNI_FACTORY, UNI_TOKEN, WETH)).connect(owner);
  })
 
  it("Rejects update as not enough time has passed", async function () {
    let Oracle = await ethers.getContractFactory("OraclePair");

    oracle = (await Oracle.deploy(UNI_FACTORY, UNI_TOKEN, WETH)).connect(owner);

    await expect(oracle.update()).to.be.revertedWith('ExampleOracleSimple: PERIOD_NOT_ELAPSED');

    expect(await oracle.consult(UNI_TOKEN, 1000000)).to.be.equal(0);    
  })

  it("Updates", async function () {   
    let Oracle = await ethers.getContractFactory("OraclePair");

    oracle = (await Oracle.deploy(UNI_FACTORY, UNI_TOKEN, WETH)).connect(owner);

    // suppose the current block has a timestamp of 01:00 PM
    await hre.network.provider.send("evm_increaseTime", [10800])
    await hre.network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 
    
    oracle.update();

    expect(await oracle.consult(UNI_TOKEN, 1000000)).to.be.above(0);    
  }) 

  it("Rejects consult of token outside of pair", async function () {   
    let Oracle = await ethers.getContractFactory("OraclePair");

    oracle = (await Oracle.deploy(UNI_FACTORY, UNI_TOKEN, WETH)).connect(owner);

    // suppose the current block has a timestamp of 01:00 PM
    await hre.network.provider.send("evm_increaseTime", [10800])
    await hre.network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 
    
    oracle.update();
    await expect(oracle.consult(SUSHI_TOKEN, 1000000)).to.be.revertedWith('ExampleOracleSimple: INVALID_TOKEN');
  }) 
})

