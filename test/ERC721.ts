import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC721", function () {

  let owner;
  let NFT;
  let indexpoolNFT;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    NFT = await ethers.getContractFactory("Pool721");

    indexpoolNFT = (await NFT.deploy()).connect(owner);

    await indexpoolNFT.generatePool721(
      owner.getAddress(),
      1, // index_id
      [2, 3] // allocation
    );
  });

  it("Pool721 - Generate Pool", async function () {
    await expect(await indexpoolNFT.balanceOf(owner.address)).to.be.above(0);
    let pool721Data = await indexpoolNFT.viewPool721(0);
    await expect(pool721Data[0]).to.be.equal(1);
    await expect(pool721Data[1][0]).to.be.equal(2);
    await expect(pool721Data[1][1]).to.be.equal(3);
  })

  it("Pool721 - Burn Pool", async function () {
    await indexpoolNFT.burnPool721(
      0, // token_id
    );

    await expect(await indexpoolNFT.balanceOf(owner.address)).to.be.equal(0);
  })

})

