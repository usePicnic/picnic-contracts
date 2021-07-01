import { expect } from "chai";
import { ethers } from "hardhat";
const hre = require("hardhat");
import constants from "../constants";

describe("OraclePath", function () {

    let owner;
    let oracle;

    const ADDRESSES = constants['POLYGON'];

    beforeEach(async function () {
        [owner] = await ethers.getSigners();
    });

    // TODO make test for consult == 0

    //   it("Skip oracle update", async function () {
    //     let path = [UNI_TOKEN, WETH];
    //     let Oracle = await ethers.getContractFactory("OraclePath");

    //     // oracleLocal is weird hack to make tests work properly :(
    //     let oracleLocal = (await Oracle.deploy(UNI_FACTORY)).connect(owner);
    //     oracleLocal.updateOracles(path);   

    //     expect(await oracleLocal.consult(path)).to.be.equal(0);    
    //   })

    it("Updates Oracle and changes prices", async function () {
        let Oracle = await ethers.getContractFactory("OraclePath");
        oracle = (await Oracle.deploy(ADDRESSES['FACTORY'])).connect(owner);

        // suppose the current block has a timestamp of 01:00 PM
        await hre.network.provider.send("evm_increaseTime", [10800])
        await hre.network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 

        let path = [ADDRESSES['TOKENS']['0'], ADDRESSES['WMAIN'], ADDRESSES['TOKENS']['1']];
        oracle.updateOracles(path);

        expect(await oracle.consult(path)).to.be.above(0);
    })
})

