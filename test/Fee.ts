import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

const hre = require('hardhat');

describe("Fees", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let addr1;
    let oracle;

    const ADDRESSES = constants['POLYGON'];

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        let Oracle = await ethers.getContractFactory("OraclePath");

        oracle = (await Oracle.deploy(ADDRESSES['FACTORY'])).connect(owner);

        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = (await Pool.deploy(ADDRESSES['ROUTER'], oracle.address)).connect(owner);

        await hardhatPool.createIndex(
            [ADDRESSES['TOKENS'][0]], // address[] _tokens
            [1000000000],  // uint256[] _allocation,
            [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]] // PATHS
        );

        // DEPOSIT
        let overrides = {value: ethers.utils.parseEther("1.")};
        await hardhatPool.deposit(
            0, // _index_id
            [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // Paths
            overrides
        );

        // Preparing to withdraw zero fee
        await hardhatPool.createIndex(
            [ADDRESSES['TOKENS'][0]], // address[] _tokens
            [1000000000],  // uint256[] _allocation,
            [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]] // PATHS
        );
    });

    it("Check fee - creator", async function () {
        expect(await hardhatPool.getAvailableCreatorFee(
            0, // Index ID
        )).to.be.equal(ethers.utils.parseEther("0.001"));
    })

    it("Pay fee - creator", async function () {
        const initialBalance = await owner.getBalance();

        await hardhatPool.payCreatorFee(
            0, // Index ID
        );

        expect(await owner.getBalance()).to.be.above(initialBalance);
    })

    it("Rejects creator fee withdraws from other address", async function () {
        let contractAsSigner0 = hardhatPool.connect(addr1);

        await expect(contractAsSigner0.payCreatorFee(
            0, // Index ID
        )).to.be.revertedWith('ONLY INDEX CREATOR CAN WITHDRAW FEES');
    })

    it("Rejects creator withdraw when there is no fee available", async function () {
        await expect(hardhatPool.payCreatorFee(
            1, // Index ID
        )).to.be.revertedWith('NO FEE TO WITHDRAW');
    })

    it("Check fee - protocol", async function () {
        expect(await hardhatPool.getAvailableProtocolFee(
            0, // Index ID
        )).to.be.equal(ethers.utils.parseEther("0.001"));
    })

    it("Pay fee - protocol", async function () {
        const initialBalance = await owner.getBalance();

        await hardhatPool.payProtocolFee(
            0, // Index ID
        );

        expect(await owner.getBalance()).to.be.above(initialBalance);
    })

    it("Rejects protocol fee withdraws from other address", async function () {
        let contractAsSigner0 = hardhatPool.connect(addr1);

        await expect(contractAsSigner0.payProtocolFee(
            0, // Index ID
        )).to.be.revertedWith('ONLY INDEXPOOL CAN CALL THIS FUNCTION');
    })

    it("Rejects creator withdraw when there is no fee available", async function () {
        await expect(hardhatPool.payProtocolFee(
            1, // Index ID
        )).to.be.revertedWith('NO FEE TO WITHDRAW');
    })
})

