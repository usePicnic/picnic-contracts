import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiPool", function () {
    let Pool;
    let hardhatPool;

    let owner;
    let addr1;
    let addr2;

    const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
    const ONEINCH_TOKEN = "0x111111111117dc0aa78b770fa6a738034120c302";

    beforeEach(async function () {
        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");
        // and Signers here.
        // [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = await Pool.deploy(UNI_ROUTER);
        [owner, addr1, addr2] = await ethers.getSigners();
    });

    describe("Deposit", function () {
        it("Two step completion - Single asset index", async function () {
            await hardhatPool.create_index(
                [1000000000],  // uint256[] _allocation,
                [UNI_TOKEN] // address[] _tokens
            );

            const initialBalance = await owner.getBalance();

            // DEPOSIT
            let overrides = { value: ethers.utils.parseEther("0.6") };
            await hardhatPool.deposit(
                0, // _index_id
                overrides
            );

            expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.address)).to.equal(0);

            // DEPOSIT
            await hardhatPool.deposit(
                0, // _index_id
                overrides
            );

            await hardhatPool.buy(
                0 // _index_id
            );

            expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.address)).to.not.equal(0);
            expect(await owner.getBalance()).to.be.below(initialBalance);
        })

        it("Two step completion - Multiple asset index", async function () {
            await hardhatPool.create_index(
                [1000000000, 1000000000],  // uint256[] _allocation,
                [UNI_TOKEN, ONEINCH_TOKEN] // address[] _tokens
            );

            const initialBalance = await owner.getBalance();

            // DEPOSIT
            let overrides = { value: ethers.utils.parseEther("1.1") };
            await hardhatPool.deposit(
                0, // _index_id
                overrides
            );

            expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.address)).to.equal(0);
            expect(await hardhatPool.get_token_balance(0, ONEINCH_TOKEN, owner.address)).to.equal(0);

            await hardhatPool.deposit(
                0, // _index_id
                overrides
            );

            await hardhatPool.buy(
                0 // _index_id
            );

            expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.address)).to.not.equal(0);
            expect(await hardhatPool.get_token_balance(0, ONEINCH_TOKEN, owner.address)).to.not.equal(0);
            expect(await owner.getBalance()).to.be.below(initialBalance);


        })

        it("Two step completion - Multiple asset index - Multiple depositors", async function () {
            await hardhatPool.create_index(
                [1000000000, 1000000000],  // uint256[] _allocation,
                [UNI_TOKEN, ONEINCH_TOKEN] // address[] _tokens
            );

            const initialBalance = await owner.getBalance();

            // DEPOSIT
            await hardhatPool.deposit(
                0, // _index_id
                { value: ethers.utils.parseEther("1.1") }
            );

            expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.address)).to.equal(0);
            expect(await hardhatPool.get_token_balance(0, ONEINCH_TOKEN, owner.address)).to.equal(0);


            let contractAsSigner0 = hardhatPool.connect(addr1);

            await contractAsSigner0.deposit(
                0, // _index_id
                { value: ethers.utils.parseEther("1.1") }
            );

            await hardhatPool.buy(
                0 // _index_id
            );

            expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.address)).to.not.equal(0);
            expect(await hardhatPool.get_token_balance(0, ONEINCH_TOKEN, owner.address)).to.not.equal(0);
            expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, addr1.address)).to.not.equal(0);
            expect(await hardhatPool.get_token_balance(0, ONEINCH_TOKEN, addr1.address)).to.not.equal(0);
            expect(await owner.getBalance()).to.be.below(initialBalance);

        })

        // TODO Deposit zero

    })

    describe("Withdraw", function () {
        it("Withdraws 50% from an index of single token", async function () {
            await hardhatPool.create_index(
                [1000000000],  // uint256[] _allocation,
                [UNI_TOKEN] // address[] _tokens
            );

            const initialBalance = await owner.getBalance();

            // DEPOSIT
            let overrides = { value: ethers.utils.parseEther("1.1") };
            await hardhatPool.deposit(
                0, // _index_id
                overrides
            );

            await hardhatPool.buy(
                0 // _index_id
            );
            

            const prevBalance = await owner.getBalance();

            // WITHDRAW
            await hardhatPool.withdraw(                
                0,   // _index_id
                500, // _sell_pct
            );

            // WITHDRAW
            await hardhatPool.withdraw(
                0,   // _index_id
                1000, // _sell_pct                
            );
            
            await hardhatPool.sell(
                0 // _index_id
            );

            expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.address)).to.equal(0);
            expect(await owner.getBalance()).to.be.above(prevBalance);
            expect(await owner.getBalance()).to.be.below(initialBalance);
        })
    })
});