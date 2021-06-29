import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";

const hre = require('hardhat');

describe("Pool", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let oracle;

    const ADDRESSES = constants['POLYGON'];

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        let Oracle = await ethers.getContractFactory("OraclePath");

        oracle = (await Oracle.deploy(ADDRESSES['FACTORY'])).connect(owner);

        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = (await Pool.deploy(ADDRESSES['ROUTER'], oracle.address)).connect(owner)
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
            expect(await hardhatPool.getIndexesLength()).to.equal(0);
        })
    });

    describe("Index Creation", function () {
        it("Index creation is reflected on getIndexesLength", async function () {
            await hardhatPool.createIndex(
                ADDRESSES['TOKENS'], // address[] _tokens
                ADDRESSES['TOKENS'].map(() => 1000000000),  // uint256[] _allocation,
                ADDRESSES['TOKENS'].map(x => [x, ADDRESSES['WMAIN']]), // paths
            );
            expect(await hardhatPool.getIndexesLength()).to.equal(1);

            console.log('aaa');

            await hardhatPool.createIndex(
                ADDRESSES['TOKENS'], // address[] _tokens
                ADDRESSES['TOKENS'].map(() => 100000000),  // uint256[] _allocation,
                ADDRESSES['TOKENS'].map(x => [x, ADDRESSES['WMAIN']]), // paths
            );
            expect(await hardhatPool.getIndexesLength()).to.equal(2);

        })

        // TODO Test path length
        it("Should not create Index with incorrect specifications", async () => {
            await expect(hardhatPool.createIndex(
                [ADDRESSES['TOKENS'][0], ADDRESSES['TOKENS'][1]], // address[] _tokens
                [1000000000],  // uint256[] _allocation,
                [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']], [ADDRESSES['TOKENS'][1], ADDRESSES['WMAIN']]], // paths
            )).to.be.revertedWith('MISMATCH IN LENGTH BETWEEN TOKENS AND ALLOCATION');
        })

        it("Should not create Index with repeat tokens", async () => {
            await expect(hardhatPool.createIndex(
                [ADDRESSES['TOKENS'][0], ADDRESSES['TOKENS'][0]], // address[] _tokens
                [1000000000, 1000000000],  // uint256[] _allocation,
                [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']], [ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]], // paths
            )).to.be.revertedWith('DUPLICATED TOKENS');
        })

        it("Should not create Index with 33 tokens", async () => {
            await expect(hardhatPool.createIndex(
                Array(33).fill(ADDRESSES['TOKENS'][0]),  // address[] _tokens
                Array(33).fill(1000000000),  // uint256[] _allocation,
                Array(33).fill([ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]),  // paths
            )).to.be.revertedWith("NO MORE THAN 32 TOKENS ALLOWED IN A SINGLE INDEX");
        })

        it("Allocation amount is too small", async () => {
            await expect(hardhatPool.createIndex(
                [ADDRESSES['TOKENS'][0]],  // address[] _tokens
                [1],  // uint256[] _allocation,
                [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]] // paths
            )).to.be.revertedWith("ALLOCATION AMOUNT IS TOO SMALL, NEEDS TO BE AT LEAST EQUIVALENT TO 100,000 WEI");
        })

        it("Rejects wrong path", async () => {
            await expect(hardhatPool.createIndex(
                [ADDRESSES['TOKENS'][0]],  // address[] _tokens
                [1],  // uint256[] _allocation,
                [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]] // paths
            )).to.be.revertedWith("WRONG PATH: TOKEN NEEDS TO BE PART OF PATH");
        })
    });
});