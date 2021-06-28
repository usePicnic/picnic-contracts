import {expect} from "chai";
import {ethers} from "hardhat";

const hre = require('hardhat');

describe("Pool", function () {
    let PoolFactory;
    let poolFactory;
    let owner;
    let oracle;

    const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
    const ONEINCH_TOKEN = "0x111111111117dc0aa78b770fa6a738034120c302";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        let Oracle = await ethers.getContractFactory("OraclePath");

        oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner);

        let NFTFactory = await ethers.getContractFactory("NFTFactory");

        let nftFactory = (await NFTFactory.deploy()).connect(owner);

        // Get the ContractFactory
        PoolFactory = await ethers.getContractFactory("IndexpoolFactory");

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        poolFactory = (await PoolFactory.deploy(UNI_ROUTER, oracle.address, nftFactory.address)).connect(owner);
    });

    describe("Deployment", function () {
        // `it` is another Mocha function. This is the one you use to define your
        // tests. It receives the test name, and a callback function.
        it("Deploys PoolFactory", async function () {
            // Checks pool has been deployed to a non-empty address
            expect(await poolFactory.address).to.be.properAddress;
        })
        it("Pool starts with an empty indexes array", async function () {
            // Checks pool has been deployed to a non-empty address
            expect(await poolFactory.getIndexesLength()).to.equal(0);
        })
    });

    describe("Index Creation", function () {
        it("Index creation is reflected on getIndexesLength", async function () {

            await poolFactory.createIndex(
                [UNI_TOKEN], // address[] _tokens
                [1000000000],  // uint256[] _allocation,
                [[UNI_TOKEN, WETH]] // paths
            );
            expect(await poolFactory.getIndexesLength()).to.equal(1);

            await poolFactory.createIndex(
                [UNI_TOKEN, ONEINCH_TOKEN], // address[] _tokens
                [1000000000, 1000000000],  // uint256[] _allocation,
                [[UNI_TOKEN, WETH], [ONEINCH_TOKEN, WETH]], // paths
            );
            expect(await poolFactory.getIndexesLength()).to.equal(2);

        })

        it("Should not create Index with incorrect specifications", async () => {
            await expect(poolFactory.createIndex(
                [UNI_TOKEN, ONEINCH_TOKEN], // address[] _tokens
                [1000000000],  // uint256[] _allocation,
                [[UNI_TOKEN, WETH], [ONEINCH_TOKEN, WETH]], // paths
            )).to.be.revertedWith('MISMATCH IN LENGTH BETWEEN TOKENS AND ALLOCATION');
        })

        it("Should not create Index with repeat tokens", async () => {
            await expect(poolFactory.createIndex(
                [UNI_TOKEN, UNI_TOKEN], // address[] _tokens
                [1000000000, 1000000000],  // uint256[] _allocation,

                [[UNI_TOKEN, WETH], [UNI_TOKEN, WETH]], // paths
            )).to.be.revertedWith('DUPLICATED TOKENS');
        })

        it("Should not create Index with 33 tokens", async () => {
            await expect(poolFactory.createIndex(
                Array(33).fill(UNI_TOKEN),  // address[] _tokens
                Array(33).fill(1000000000),  // uint256[] _allocation,

                Array(33).fill([UNI_TOKEN, WETH]),  // paths
            )).to.be.revertedWith("NO MORE THAN 32 TOKENS ALLOWED IN A SINGLE INDEX");
        })

        it("Allocation amount is too small", async () => {
            await expect(poolFactory.createIndex(
                [UNI_TOKEN],  // address[] _tokens
                [1],  // uint256[] _allocation,

                [[UNI_TOKEN, WETH]] // paths
            )).to.be.revertedWith("ALLOCATION AMOUNT IS TOO SMALL, NEEDS TO BE AT LEAST EQUIVALENT TO 100,000 WEI");
        })

        it("Rejects wrong path", async () => {
            await expect(poolFactory.createIndex(
                [UNI_TOKEN],  // address[] _tokens
                [1],  // uint256[] _allocation,
                [[WETH, UNI_TOKEN]] // paths
            )).to.be.revertedWith("WRONG PATH: TOKEN NEEDS TO BE PART OF PATH");
        })
    });
});