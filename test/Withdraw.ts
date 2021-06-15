import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

describe("Withdraw", function () {
    let Pool;
    let hardhatPool;
    let owner;

    const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";

    beforeEach(async function () {
        [owner] = await ethers.getSigners()

        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = (await Pool.deploy(UNI_ROUTER)).connect(owner)

        await hardhatPool.create_index(
            [1000000000],  // uint256[] _allocation,
            [UNI_TOKEN] // address[] _tokens
        );

        // DEPOSIT
        let overrides = { value: ethers.utils.parseEther("1") };
        await hardhatPool.deposit(
            0, // _index_id
            overrides
        );

        hardhatPool.buy(
            0 // _index_id
        );
    });

    it("Withdraws and sell from an index of single token", async function () {
        const prevBalance = await owner.getBalance();

        // WITHDRAW
        await hardhatPool.withdraw(
            0,   // _index_id
            1000, // _sell_pct
        );

        await hardhatPool.sell(
            0,   // _index_id
        );

        expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.equal(0);
        expect(await owner.getBalance()).to.be.above(prevBalance);
    })

    it("Withdraws and sell a single token", async function () {
        const prevBalance = await owner.getBalance();

        // WITHDRAW
        await hardhatPool.withdraw(
            0,   // _index_id
            1000, // _sell_pct
        );

        await hardhatPool.sell_token(
            UNI_TOKEN,   // _index_id
        );

        expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.equal(0);
        expect(await owner.getBalance()).to.be.above(prevBalance);
    })

    it("Withdraws and sell 50% from an index of single token", async function () {
        const prevBalance = await owner.getBalance();

        // WITHDRAW
        const withdraw_result = await hardhatPool.withdraw(
            0,   // _index_id
            500, // _sell_pct
        );

        await hardhatPool.sell(
            0,   // _index_id
        );

        expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.be.above(0);
        expect(await owner.getBalance()).to.be.above(prevBalance);
    })

    it("Rejects 0% Withdrawals", async function () {
        // WITHDRAW
        await expect(hardhatPool.withdraw(
            0,   // _index_id
            0, // _sell_pct
        )).to.be.revertedWith('SELL PCT NEEDS TO BE GREATER THAN ZERO');
    })

    it("Rejects greater than 100% Withdrawals", async function () {
        // WITHDRAW
        await expect(hardhatPool.withdraw(
            0,   // _index_id
            1001, // _sell_pct
        )).to.be.revertedWith("CAN'T SELL MORE THAN 100% OF FUNDS");        
    })
});