import { expect } from "chai";
import { ethers } from "hardhat";
const hre = require("hardhat");

describe("OraclePath", function () {

    let owner;
    let oracle;

    const UNI_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
    const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
    const ONEINCH_TOKEN = "0x111111111117dc0aa78b770fa6a738034120c302";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

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
        oracle = (await Oracle.deploy(UNI_FACTORY)).connect(owner);

        // suppose the current block has a timestamp of 01:00 PM
        await hre.network.provider.send("evm_increaseTime", [10800])
        await hre.network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 

        let path = [UNI_TOKEN, WETH, ONEINCH_TOKEN];
        oracle.updateOracles(path);

        expect(await oracle.consult(path)).to.be.above(0);
    })
})

