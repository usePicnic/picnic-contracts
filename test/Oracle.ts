import { expect } from "chai";
import { ethers } from "hardhat";

describe("Oracle", function () {

  let owner;
  let oracle;

    const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    let Oracle = await ethers.getContractFactory("OraclePath");

    oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner); 

    await oracle.updateOracles([WETH, UNI_TOKEN]);

    await oracle.consult([WETH, UNI_TOKEN]);
    await oracle.consult([WETH, UNI_TOKEN]);
  });

  it("Oracle", async function () {
      1 + 1;    
  })

})

