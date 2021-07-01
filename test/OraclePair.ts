import {expect} from "chai";
import {ethers} from "hardhat";

const hre = require("hardhat");
import constants from "../constants";

describe("OraclePair", function () {

    let owner;
    let oracle;

    const ADDRESSES = constants['POLYGON'];

    beforeEach(async function () {
        [owner] = await ethers.getSigners();
    });

    it("Deploys", async function () {
        let Oracle = await ethers.getContractFactory("OraclePair");

        oracle = (await Oracle.deploy(ADDRESSES['FACTORY'], ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN'])).connect(owner);
    })

    it("Rejects update as not enough time has passed", async function () {
        let Oracle = await ethers.getContractFactory("OraclePair");

        oracle = (await Oracle.deploy(ADDRESSES['FACTORY'], ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN'])).connect(owner);

        await expect(oracle.update()).to.be.revertedWith('ExampleOracleSimple: PERIOD_NOT_ELAPSED');

        expect(await oracle.consult(ADDRESSES['TOKENS'][0], 1000000)).to.be.equal(0);
    })

    it("Updates", async function () {
        let Oracle = await ethers.getContractFactory("OraclePair");

        oracle = (await Oracle.deploy(ADDRESSES['FACTORY'], ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN'])).connect(owner);

        // suppose the current block has a timestamp of 01:00 PM
        await hre.network.provider.send("evm_increaseTime", [10800])
        await hre.network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

        oracle.update();

        expect(await oracle.consult(ADDRESSES['TOKENS'][0], 1000000)).to.be.above(0);
    })

    it("Rejects consult of token outside of pair", async function () {
        let Oracle = await ethers.getContractFactory("OraclePair");

        oracle = (await Oracle.deploy(ADDRESSES['FACTORY'], ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN'])).connect(owner);

        // suppose the current block has a timestamp of 01:00 PM
        await hre.network.provider.send("evm_increaseTime", [10800])
        await hre.network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

        oracle.update();
        await expect(oracle.consult(ADDRESSES['TOKENS'][1], 1000000)).to.be.revertedWith('ExampleOracleSimple: INVALID_TOKEN');
    })
})

