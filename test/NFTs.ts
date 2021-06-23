import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

describe("Pool", function () {
    let Pool;
    let hardhatPool;
    let owner;
    let pool721;

    const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const UNI_TOKEN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
    const ONEINCH_TOKEN = "0x111111111117dc0aa78b770fa6a738034120c302";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    let tokens = [UNI_TOKEN, ONEINCH_TOKEN]

    beforeEach(async function () {
        [owner] = await ethers.getSigners()

        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = (await Pool.deploy(UNI_ROUTER)).connect(owner);        

        pool721 = await ethers.getContractAt(
            "Pool721",
            await hardhatPool.get_pool721_address()
            );

        await hardhatPool.create_index(
            tokens.map(() => 1000000000),  // uint256[] _allocation,
            tokens, // address[] _tokens
            tokens.map(x => [x, WETH]), // paths
        );

        // DEPOSIT
        let overrides = { value: ethers.utils.parseEther("1.") };
        await hardhatPool.deposit(
            0, // _index_id
            tokens.map(x => [WETH, x]), // paths
            overrides
        );

        await hardhatPool.create_index(
            tokens.map(() => 1000000000),  // uint256[] _allocation,
            tokens, // address[] _tokens
            tokens.map(x => [x, WETH]), // paths
        );

        // DEPOSIT
        await hardhatPool.deposit(
            1, // _index_id
            tokens.map(x => [WETH, x]), // paths
            overrides
        );
    });

    it("Cash out from index is working :D", async () => {
        // All balances sshould live inside the contract
        await expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.above(0);
        await expect(await hardhatPool.get_token_balance(1, UNI_TOKEN, owner.getAddress())).to.above(0);

        // Balance should live outside the contract
        await hardhatPool.mint_Pool721(0);

        await expect(await pool721.balanceOf(owner.address)).to.be.equal(1);
        await expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.equal(0);

        // Two tokens should be created
        await hardhatPool.mint_Pool721(1);
        await expect(await pool721.balanceOf(owner.address)).to.be.equal(2);
    });
    
    it("Cash out and burn token", async () => {
        await expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.above(0);
        await hardhatPool.mint_Pool721(0);
                
        await expect(await pool721.balanceOf(owner.address)).to.be.equal(1);
        await expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.equal(0);
        
        await hardhatPool.burn_Pool721(0);

        await expect(await pool721.balanceOf(owner.address)).to.be.equal(0);
        await expect(await hardhatPool.get_token_balance(0, UNI_TOKEN, owner.getAddress())).to.above(0);
    });
});