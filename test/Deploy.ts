import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

describe("Pool", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let oracle;

    const UNI_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
    const UNI_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
    const UNI_TOKEN = "0x831753DD7087CaC61aB5644b308642cc1c33Dc13";
    const ONEINCH_TOKEN = "0x111111111117dc0aa78b770fa6a738034120c302";
    const WETH = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        let Oracle = await ethers.getContractFactory("OraclePath");

        oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner);

        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = (await Pool.deploy(UNI_ROUTER, oracle.address)).connect(owner)

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
                [UNI_TOKEN], // address[] _tokens
                [1000000000],  // uint256[] _allocation,
                [[UNI_TOKEN, WETH]] // paths
            );
            expect(await hardhatPool.getIndexesLength()).to.equal(1);

            await hardhatPool.createIndex(
                [UNI_TOKEN, ONEINCH_TOKEN], // address[] _tokens
                [1000000000, 1000000000],  // uint256[] _allocation,
                [[UNI_TOKEN, WETH], [ONEINCH_TOKEN, WETH]], // paths
            );
            expect(await hardhatPool.getIndexesLength()).to.equal(2);

        })

        it("Should not create Index with incorrect specifications", async () => {
            await expect(hardhatPool.createIndex(
                [UNI_TOKEN, ONEINCH_TOKEN], // address[] _tokens
                [1000000000],  // uint256[] _allocation,
                [[UNI_TOKEN, WETH], [ONEINCH_TOKEN, WETH]], // paths
            )).to.be.revertedWith('MISMATCH IN LENGTH BETWEEN TOKENS AND ALLOCATION');
        })

        it("Should not create Index with repeat tokens", async () => {
            await expect(hardhatPool.createIndex(
                [UNI_TOKEN, UNI_TOKEN], // address[] _tokens
                [1000000000, 1000000000],  // uint256[] _allocation,
                [[UNI_TOKEN, WETH], [UNI_TOKEN, WETH]], // paths
            )).to.be.revertedWith('DUPLICATED TOKENS');
        })

        it("Should not create Index with 33 tokens", async () => {
            await expect(hardhatPool.createIndex(
                Array(33).fill(UNI_TOKEN),  // address[] _tokens
                Array(33).fill(1000000000),  // uint256[] _allocation,
                Array(33).fill([UNI_TOKEN, WETH]),  // paths
            )).to.be.revertedWith("NO MORE THAN 32 TOKENS ALLOWED IN A SINGLE INDEX");
        })

        it("Allocation amount is too small", async () => {
            await expect(hardhatPool.createIndex(
                [UNI_TOKEN],  // address[] _tokens
                [1],  // uint256[] _allocation,
                [[UNI_TOKEN, WETH]] // paths
            )).to.be.revertedWith("ALLOCATION AMOUNT IS TOO SMALL, NEEDS TO BE AT LEAST EQUIVALENT TO 100,000 WEI");
        })

        it("Rejects wrong path", async () => {
            await expect(hardhatPool.createIndex(
                [UNI_TOKEN],  // address[] _tokens
                [1],  // uint256[] _allocation,
                [[WETH, UNI_TOKEN]] // paths
            )).to.be.revertedWith("WRONG PATH: TOKEN NEEDS TO BE PART OF PATH");
        })
    });
});