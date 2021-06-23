import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

describe("Withdraw", function () {
    let Pool;
    let hardhatPool;
    let owner;

    const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
    const ONEINCH_TOKEN = "0x111111111117dc0aa78b770fa6a738034120c302";
    const LINK_TOKEN = "0x514910771af9ca656af840dff83e8264ecf986ca";
    const CRYTPOCOM_TOKEN = "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b";
    const SYNTHETIX_TOKEN = "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f";
    const COMPOUND_TOKEN = "0xc00e94cb662c3520282e6f5717214004a7f26888";
    const GRAPH_TOKEN = "0xc944e90c64b2c07662a292be6244bdf05cda44a7";
    const DEV_TOKEN = "0x5cAf454Ba92e6F2c929DF14667Ee360eD9fD5b26";
    const RLC_TOKEN = "0x607F4C5BB672230e8672085532f7e901544a7375";
    const SUSHI_TOKEN = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ETH = "0x0000000000000000000000000000000000000000";

    const tokens = [UNI_TOKEN, ONEINCH_TOKEN, LINK_TOKEN, CRYTPOCOM_TOKEN, SYNTHETIX_TOKEN,
        COMPOUND_TOKEN, GRAPH_TOKEN, DEV_TOKEN, RLC_TOKEN, SUSHI_TOKEN, ETH]

    beforeEach(async function () {
        [owner] = await ethers.getSigners()

        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = (await Pool.deploy(UNI_ROUTER)).connect(owner)

        await hardhatPool.create_index(
            tokens.map(() => 1000000000),  // uint256[] _allocation,
            tokens, // address[] _tokens
            tokens.map(x => [x, WETH]), // paths
        );

        // DEPOSIT
        let overrides = { value: ethers.utils.parseEther("10.") };
        await hardhatPool.deposit(
            0, // _index_id
            tokens.map(x => [WETH, x]), // paths
            overrides
        );
    });

    it("Withdraws from an index of single token", async function () {
        const prevBalance = await owner.getBalance();

        // WITHDRAW
        await hardhatPool.withdraw(
            0,   // _index_id
            1000, // _sell_pct
            tokens.map(x => [x, WETH]) // paths
        );

        expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.equal(0);
        expect(await owner.getBalance()).to.be.above(prevBalance);
    })


    it("Withdraws 50% from an index of single token", async function () {
        const prevBalance = await owner.getBalance();

        // WITHDRAW
        const withdraw_result = await hardhatPool.withdraw(
            0,   // _index_id
            500, // _sell_pct
            tokens.map(x => [x, WETH]) // paths
        );

        expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.be.above(0);
        expect(await owner.getBalance()).to.be.above(prevBalance);
    })

    it("Rejects 0% Withdrawals", async function () {
        // WITHDRAW
        await expect(hardhatPool.withdraw(
            0,   // _index_id
            0, // _sell_pct
            tokens.map(x => [x, WETH]) // paths
        )).to.be.revertedWith('SELL PCT NEEDS TO BE GREATER THAN ZERO');
    })

    it("Rejects greater than 100% Withdrawals", async function () {
        // WITHDRAW
        await expect(hardhatPool.withdraw(
            0,   // _index_id
            1001, // _sell_pct
            tokens.map(x => [x, WETH]) // paths
        )).to.be.revertedWith("CAN'T SELL MORE THAN 100% OF FUNDS");
    })

    it("Rejects Withdrawals without shares bought", async function () {
        await hardhatPool.create_index(
            [1000000000],  // uint256[] _allocation,
            [UNI_TOKEN], // address[] _tokens
            [[UNI_TOKEN, WETH]] // paths
        );

        // WITHDRAW
        await expect(hardhatPool.withdraw(
            1,   // _index_id
            1000, // _sell_pct
            [[UNI_TOKEN, WETH]] // paths
        )).to.be.revertedWith('NEEDS TO HAVE SHARES OF THE INDEX');
    })
});