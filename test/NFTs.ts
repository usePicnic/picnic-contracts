import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

const hre = require('hardhat');

describe("NFTs", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let addr1;
    let pool721;
    let oracle;

    const ADDRESSES = constants['POLYGON'];
    let tokens = ADDRESSES['TOKENS'];

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners()

        let Oracle = await ethers.getContractFactory("OraclePath");

        oracle = (await Oracle.deploy(ADDRESSES["FACTORY"])).connect(owner);

        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = (await Pool.deploy(ADDRESSES["ROUTER"], oracle.address)).connect(owner)

        pool721 = await ethers.getContractAt(
            "MIndexPoolNFT",
            await hardhatPool.getPool721Address()
        );

        await hardhatPool.createIndex(
            tokens, // address[] _tokens
            tokens.map(() => 1000000000),  // uint256[] _allocation,
            tokens.map(x => [x, ADDRESSES['WMAIN']]), // paths
        );

        // DEPOSIT
        let overrides = {value: ethers.utils.parseEther("1.")};
        await hardhatPool.deposit(
            0, // _index_id
            tokens.map(x => [ADDRESSES['WMAIN'], x]), // paths
            overrides
        );

        await hardhatPool.createIndex(
            tokens, // address[] _tokens
            tokens.map(() => 1000000000),  // uint256[] _allocation,
            tokens.map(x => [x, ADDRESSES['WMAIN']]), // paths
        );

        // DEPOSIT
        await hardhatPool.deposit(
            1, // _index_id
            tokens.map(x => [ADDRESSES['WMAIN'], x]), // paths
            overrides
        );

        await hardhatPool.createIndex(
            tokens, // address[] _tokens
            tokens.map(() => 1000000000),  // uint256[] _allocation,
            tokens.map(x => [x, ADDRESSES['WMAIN']]), // paths
        );
    });

    it("Mint token is working :D", async () => {
        // All balances sshould live inside the contract
        await expect(await hardhatPool.getTokenBalance(0, ADDRESSES['TOKENS'][0], owner.getAddress())).to.above(0);
        await expect(await hardhatPool.getTokenBalance(1, ADDRESSES['TOKENS'][0], owner.getAddress())).to.above(0);

        // Balance should live outside the contract
        await hardhatPool.mintPool721(0, 1000);

        await expect(await pool721.balanceOf(owner.address)).to.be.equal(1);
        await expect(await hardhatPool.getTokenBalance(0, ADDRESSES['TOKENS'][0], owner.getAddress())).to.equal(0);

        // Two tokens should be created
        await hardhatPool.mintPool721(1, 1000);
        await expect(await pool721.balanceOf(owner.address)).to.be.equal(2);
    });

    it("Rejects mint if there is no deposit", async () => {
        await expect(
            hardhatPool.mintPool721(2, 1000)
        ).to.be.revertedWith("ALLOCATION CAN'T BE ZERO");
    });

    it("Burn token", async () => {
        await expect(await hardhatPool.getTokenBalance(0, ADDRESSES['TOKENS'][0], owner.getAddress())).to.above(0);
        await hardhatPool.mintPool721(0, 1000);

        await expect(await pool721.balanceOf(owner.address)).to.be.equal(1);
        await expect(await hardhatPool.getTokenBalance(0, ADDRESSES['TOKENS'][0], owner.getAddress())).to.equal(0);

        await hardhatPool.burnPool721(0);

        await expect(await pool721.balanceOf(owner.address)).to.be.equal(0);
        await expect(await hardhatPool.getTokenBalance(0, ADDRESSES['TOKENS'][0], owner.getAddress())).to.above(0);
    });

    it("Rejects burn token when called by someone who is not the token owner", async () => {
        let contractAsSigner0 = hardhatPool.connect(addr1);

        await hardhatPool.mintPool721(0, 1000);

        await expect(
            contractAsSigner0.burnPool721(0)
        ).to.be.revertedWith("ONLY CALLABLE BY TOKEN OWNER");
    });

    it("Rejects calls from other addresses", async () => {
        await expect(pool721.generatePool721(
            owner.getAddress(),
            0, // index_id
            [2, 3] // allocation
        )).to.be.revertedWith("ONLY INDEXPOOL CAN CALL THIS FUNCTION");

        await expect(pool721.burnPool721(
            0
        )).to.be.revertedWith("ONLY INDEXPOOL CAN CALL THIS FUNCTION");

    });
});