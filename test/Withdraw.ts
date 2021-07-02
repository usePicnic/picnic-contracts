import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

const hre = require('hardhat');

describe("Withdraw", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let oracle;

    const ADDRESSES = constants['POLYGON'];
    const tokens = ADDRESSES['TOKENS'];

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

        await hardhatPool.createIndex(
            tokens, // address[] _tokens
            tokens.map(() => 1000000000),  // uint256[] _allocation,
            tokens.map(x => [x, ADDRESSES['WMAIN']]), // paths
        );

        // DEPOSIT
        let overrides = {value: ethers.utils.parseEther("10.")};
        await hardhatPool.deposit(
            0, // _token_id
            tokens.map(x => [ADDRESSES['WMAIN'], x]), // paths
            overrides
        );
    });

    it("Withdraws from an index of single token", async function () {
        const prevBalance = await owner.getBalance();

        // WITHDRAW
        await hardhatPool.withdraw(
            [0],   // _token_id
            [100000], // _sell_pct
            tokens.map(x => [x, ADDRESSES['WMAIN']]) // paths
        );

        expect(await hardhatPool.getTokenBalance(0, tokens[0], owner.getAddress())).to.equal(0);
        expect(await owner.getBalance()).to.be.above(prevBalance);
    })

    // TODO reject 2 withdrawals


    it("Withdraws 50% from an index of single token", async function () {
        const prevBalance = await owner.getBalance();

        // WITHDRAW
        const withdraw_result = await hardhatPool.withdraw(
            [0],   // _token_id
            [50000], // _sell_pct
            tokens.map(x => [x, ADDRESSES['WMAIN']]) // paths
        );

        expect(await hardhatPool.getTokenBalance(1, tokens[0])).to.be.above(0);
        expect(await owner.getBalance()).to.be.above(prevBalance);
    })

    it("Rejects 0% Withdrawals", async function () {
        // WITHDRAW
        await expect(hardhatPool.withdraw(
            [0],   // _token_id
            [0], // _sell_pct
            tokens.map(x => [x, ADDRESSES['WMAIN']]) // paths
        )).to.be.revertedWith('SELL PCT NEEDS TO BE GREATER THAN ZERO');
    })

    it("Rejects greater than 100% Withdrawals", async function () {
        // WITHDRAW
        await expect(hardhatPool.withdraw(
            [0],   // _token_id
            [100001], // _sell_pct
            tokens.map(x => [x, ADDRESSES['WMAIN']]) // paths
        )).to.be.revertedWith("CAN'T SELL MORE THAN 100% OF FUNDS");
    })

    it("Rejects wrong path", async function () {
        // WITHDRAW
        await expect(hardhatPool.withdraw(
            [0],   // _token_id
            [100000], // _sell_pct
            tokens.map(x => [ADDRESSES['WMAIN'], x]) // paths
        )).to.be.revertedWith("WRONG PATH: TOKEN NEEDS TO BE PART OF PATH");
    })
    // TODO withdraw from a token that is not yours
});