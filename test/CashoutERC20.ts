import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

describe("Cash-out ERC20 tokens", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let addr1;
    let oracle;

    const ADDRESSES = constants['POLYGON'];

    let tokens = ADDRESSES['TOKENS'];
    tokens.push(ADDRESSES['MAIN'])

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        let Oracle = await ethers.getContractFactory("OraclePath");

        oracle = (await Oracle.deploy(ADDRESSES['FACTORY'])).connect(owner);

        Pool = await ethers.getContractFactory("Pool");

        hardhatPool = (await Pool.deploy(ADDRESSES['ROUTER'], oracle.address)).connect(owner)

        await hardhatPool.createIndex(
            tokens, // address[] _tokens
            tokens.map(() => 1000000000),  // uint256[] _allocation,
            tokens.map(x => [x, ADDRESSES['WMAIN']]), // paths
        );

        // DEPOSIT
        let overrides = {value: ethers.utils.parseEther("99.")};
        await hardhatPool.deposit(
            0, // _index_id
            ADDRESSES['TOKENS'].map(x => [ADDRESSES['WMAIN'], x]), // paths
            overrides
        );
    });

    it("Checks if there is positive balance for all tokens", async function () {
        const initialBalance = await owner.getBalance();
        await hardhatPool.cashOutERC20(
            0, // index_id,
            1000, // shares_pct
        );
        const finalBalance = await owner.getBalance();

        for (var i = 0; i < ADDRESSES['TOKENS'].length - 1; i++) { // Don't check WMATIC;
            let erc20 = await ethers.getContractAt(
                "IERC20",
                ADDRESSES['TOKENS'][i],
            );

            let erc20_balance = await erc20.balanceOf(owner.getAddress());
            await expect(erc20_balance).to.be.above(0);
        }

        await expect(finalBalance).to.be.above(initialBalance);
    });

    it("Rejects withdraw of 0.0%", async function () {
        await expect(hardhatPool.cashOutERC20(
            0,   // _index_id
            0, // _sell_pct
        )).to.be.revertedWith("AMOUNT TO CASH OUT IS TOO SMALL");
    });

    it("Rejects withdraw of 100.1%", async function () {
        await expect(hardhatPool.cashOutERC20(
            0,   // _index_id
            1001, // _sell_pct
        )).to.be.revertedWith('INSUFFICIENT FUNDS');
    });

    it("Force cashout by admin", async function () {

        let initialERC20Balances = [];
        let initialERC20BalancesOwner = [];
        let erc20_balance;
        let erc20_balance_owner;

        for (var i = 0; i < ADDRESSES['TOKENS'].length - 1; i++) { // Don't check WMATIC;
            let erc20 = await ethers.getContractAt(
                "IERC20",
                ADDRESSES['TOKENS'][i],
            );

            erc20_balance = await erc20.balanceOf(addr1.getAddress());
            initialERC20Balances.push(erc20_balance);

            erc20_balance_owner = await erc20.balanceOf(owner.getAddress());
            initialERC20BalancesOwner.push(erc20_balance_owner);
        }

        let contractAsSigner0 = hardhatPool.connect(addr1);

        await contractAsSigner0.deposit(
            0, // _index_id
            ADDRESSES['TOKENS'].map(x => [ADDRESSES['WMAIN'], x]), // paths
            {value: ethers.utils.parseEther("10.")}
        );

        await hardhatPool.cashOutERC20Admin(
            addr1.getAddress(), // address user,
            0, // uint256 index_id,
            1000 // uint256 shares_pct
        )

        for (var i = 0; i < ADDRESSES['TOKENS'].length - 1; i++) { // Don't check WMATIC;
            let erc20 = await ethers.getContractAt("IERC20", ADDRESSES['TOKENS'][i]);

            erc20_balance = await erc20.balanceOf(addr1.getAddress());
            erc20_balance_owner = await erc20.balanceOf(owner.getAddress());

            await expect(erc20_balance).to.be.above(initialERC20Balances[i]);
            await expect(erc20_balance_owner).to.be.equal(initialERC20BalancesOwner[i]);
        }
    });
})

