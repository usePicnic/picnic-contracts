import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

const hre = require('hardhat');

describe("Read", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let oracle;

    const ADDRESSES = constants['POLYGON'];

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");

        let Oracle = await ethers.getContractFactory("OraclePath");

        oracle = (await Oracle.deploy(ADDRESSES['FACTORY'])).connect(owner);

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = (await Pool.deploy(ADDRESSES['ROUTER'], oracle.address)).connect(owner)

        await hardhatPool.createIndex(
            [ADDRESSES['TOKENS'][0]], // address[] _tokens
            [1000000000],  // uint256[] _allocation,
            [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]] // paths
        );

        // DEPOSIT
        let overrides = {value: ethers.utils.parseEther("1.")};
        await hardhatPool.deposit(
            0, // _index_id
            [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // paths
            overrides
        );
    });

    it("Get Indexes Creators", async function () {
        let creators = await hardhatPool.getIndexesCreators(
        );
        expect(creators[0]).to.be.equal(await owner.getAddress());
    })

    it("Read - Get Token Balance", async function () {
        let token_balance = await hardhatPool.getTokenBalance(
            0, // Index ID
            ADDRESSES['TOKENS'][0], // token address
            await owner.getAddress() // owner address
        );
        await expect(token_balance).to.not.equal(0);
    })

    it("Get Index Allocation", async function () {
        let allocation = await hardhatPool.getIndexAllocation(
            0 // index id
        );
        expect(allocation[0]).to.not.equal(0);
    })

    it("Get Index Allocation", async function () {
        let allocation = await hardhatPool.getIndexTokens(
            0 // index id
        );
        expect(allocation[0]).to.be.equal(ADDRESSES['TOKENS'][0]);
    })

    it("Get Index", async function () {
        let index = await hardhatPool.getIndex(
            0 // index id
        );
        expect(index['creator']).to.be.equal(await owner.getAddress());
        expect(index['allocation'][0]).to.not.equal(0);
        expect(index['tokens'][0]).to.be.equal(ADDRESSES['TOKENS'][0]);
    })
})

