
import { expect } from "chai";
import { ethers } from "hardhat";

const hre = require('hardhat');

import { BINANCE_ADDRESS, BINANCE7_ADDRESS, DAI_RICH_ADDRESS } from '../Constants';

describe("Pool", function () {
    let Pool;
    let hardhatPool;

    let owner;
    let addr1;
    let addr2;
    let addrs;

    const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    // Tokens
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

    const tokens = [UNI_TOKEN, ONEINCH_TOKEN, LINK_TOKEN, CRYTPOCOM_TOKEN, SYNTHETIX_TOKEN,
        COMPOUND_TOKEN, GRAPH_TOKEN, DEV_TOKEN, RLC_TOKEN, SUSHI_TOKEN]

    beforeEach(async function () {
        await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [BINANCE_ADDRESS],
        });
        owner = await ethers.provider.getSigner(BINANCE_ADDRESS);

        // Get the ContractFactory
        Pool = await ethers.getContractFactory("Pool");
        // and Signers here.
        // [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // To deploy our contract, we just have to call Pool.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatPool = (await Pool.deploy(UNI_ROUTER)).connect(owner);

    });

    describe("Deposit", function () {
        it("Deposits to an index of multiple tokens", async function () {
            await hardhatPool.create_index(
                tokens.map(() => 1000000000),  // uint256[] _allocation,
                tokens // address[] _tokens
            );

            const initialBalance = await owner.getBalance();


            // DEPOSIT
            let overrides = { value: ethers.utils.parseEther(".01") };
            const deposit_result = await hardhatPool.deposit(
                0, // _index_id
                overrides
            );

        })

        it("Deposits a thousand times :O", async function () {
            await hardhatPool.create_index(
                tokens.map(() => 1000000000),  // uint256[] _allocation,
                tokens // address[] _tokens
            );

            const initialBalance = await owner.getBalance();


            for (var i = 1; i < 20; i++) {
                // DEPOSIT
                let overrides = { value: ethers.utils.parseEther("1.1") };
                const deposit_result = await hardhatPool.deposit(
                    0, // _index_id
                    overrides
                );
            }

            // Buy
            await hardhatPool.buy(
                0, // _index_id                
            );

        })


        // TODO Deposit zero

    })

    // describe("Withdraw", function () {
    //     it("Withdraws 50% from an index of single token", async function () {
    //         await hardhatPool.create_index(
    //             tokens.map(() => 1),  // uint256[] _allocation,
    //             tokens // address[] _tokens
    //         );

    //         const initialBalance = await owner.getBalance();

    //         // DEPOSIT
    //         let overrides = { value: ethers.utils.parseEther("1") };
    //         const deposit_result = await hardhatPool.deposit(
    //             0, // _index_id
    //             overrides
    //         );

    //         const prevBalance = await owner.getBalance();

    //         // WITHDRAW
    //         const withdraw_result = await hardhatPool.withdraw(
    //             50, // _sell_pct
    //             0,   // _index_id
    //         );
    //     })

    //     it("Withdraws from an index of multiple tokens", async function () {
    //         await hardhatPool.create_index(
    //             tokens.map(() => 1),  // uint256[] _allocation,
    //             tokens // address[] _tokens
    //         );

    //         const initialBalance = await owner.getBalance();

    //         // DEPOSIT
    //         let overrides = { value: ethers.utils.parseEther("1") };
    //         const deposit_result = await hardhatPool.deposit(
    //             0, // _index_id
    //             overrides
    //         );

    //         const prevBalance = await owner.getBalance();

    //         // WITHDRAW
    //         const withdraw_result = await hardhatPool.withdraw(
    //             100, // _sell_pct
    //             0,   // _index_id
    //         );


    //     })
    // })
});