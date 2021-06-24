import { expect } from "chai";
import { ethers } from "hardhat";

describe("Oracle", function () {

  let owner;
  let NFT;
  let indexpoolNFT;

    const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    NFT = await ethers.getContractFactory("IPOracle");

    indexpoolNFT = (await NFT.deploy(UNI_FACTORY, WETH, UNI_TOKEN)).connect(owner); 
  });

  it("Oracle", async function () {
      1 + 1;    
  })

})

