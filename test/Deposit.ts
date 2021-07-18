import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

describe("Deposit", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let oracle;

    const BASE_ASSET = BigInt(1000000000000000000);
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

        await hardhatPool.createIndex(
            [ADDRESSES['TOKENS'][0]], // address[] _tokens
            [1000000000],  // uint256[] _allocation,
            [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]] // paths
        );
    });

    it("Deposits and buys an index of single token", async function () {
        const initialBalance = await owner.getBalance();

        // DEPOSIT
        let overrides = {value: ethers.utils.parseEther("1.1")};
        const deposit_result = await hardhatPool.deposit(
            0, // _index_id
            [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // paths
            overrides
        );

        expect(await hardhatPool.getTokenBalance(0, ADDRESSES['TOKENS'][0], owner.getAddress())).to.above(0);
        expect(await owner.getBalance()).to.be.below(initialBalance);
    })

    it("Rejects small deposits", async function () {
        await expect(hardhatPool.deposit(
            0, // _index_id
            [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]]
        )).to.be.revertedWith('MINIMUM DEPOSIT OF 0.001 MATIC');
    })

    it("Rejects big deposits", async function () {
        // DEPOSIT
        let overrides = {value: ethers.utils.parseEther("101")};
        await expect(hardhatPool.deposit(
            0, // _index_id
            [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // paths
            overrides
        )).to.be.revertedWith('EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE');
    })

    it("Rejects wrong path", async function () {
        // DEPOSIT
        let overrides = {value: ethers.utils.parseEther("10")};
        await expect(hardhatPool.deposit(
            0, // _index_id
            [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]], // paths
            overrides
        )).to.be.revertedWith('WRONG PATH: TOKEN NEEDS TO BE PART OF PATH');
    })

    it("Increase deposit limit", async function () {
        let overrides = {value: ethers.utils.parseEther("101")};
        await hardhatPool.setMaxDeposit(BigInt(200) * BASE_ASSET);

        await hardhatPool.deposit(
            0, // _index_id
            [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // paths
            overrides
        );

        overrides = {value: ethers.utils.parseEther("201")};
        await expect(hardhatPool.deposit(
            0, // _index_id
            [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // paths
            overrides
        )).to.be.revertedWith('EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE');
    })

    it("Figuring out buggy case # 1", async function () {
        let tokens = ['0xD6DF932A45C0f255f85145f286eA0b292B21C90B',
            '0xF84BD51eab957c2e7B7D646A3427C5A50848281D',
            '0x6aB6d61428fde76768D7b45D8BFeec19c6eF91A8']
        let paths = [['0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            '0xD6DF932A45C0f255f85145f286eA0b292B21C90B'],
            ['0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
                '0x831753DD7087CaC61aB5644b308642cc1c33Dc13',
                '0xF84BD51eab957c2e7B7D646A3427C5A50848281D'],
            ['0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
                '0x6aB6d61428fde76768D7b45D8BFeec19c6eF91A8']]

        await hardhatPool.createIndex(
            tokens, // address[] _tokens
            [32131631195684, 3510, BigInt(669904507422815072459)],  // uint256[] _allocation,
            paths.map((l) => {
                return l.slice().reverse();
            }) // paths
        );

        const initialBalance = await owner.getBalance();

        // DEPOSIT
        let overrides = {value: ethers.utils.parseEther("10")};

        await hardhatPool.deposit(
            1, // _index_id
            paths, // paths
            overrides
        );

        expect(await hardhatPool.getTokenBalance(0, tokens[0], owner.getAddress())).to.above(0);
        expect(await owner.getBalance()).to.be.below(initialBalance);
    })
})

