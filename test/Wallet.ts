import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

const hre = require('hardhat');

describe("Wallet", function () {
    let uniswapV2SwapBridge;
    let wallet;

    const ADDRESSES = constants['POLYGON'];

    beforeEach(async function () {
      let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
      console.log("uniswapRouter (in test):",ADDRESSES['ROUTER']);
      uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy(ADDRESSES['ROUTER']);
      await uniswapV2SwapBridge.deployed();
      console.log("uniswapV2SwapBridge:",uniswapV2SwapBridge.address);

      let Wallet = await ethers.getContractFactory("Wallet");
      wallet = await Wallet.deploy();
      await wallet.deployed();
      console.log("wallet:",wallet.address);
      
      
      // await expect(wallet.deposit(_bridgeAddresses, _bridgeEncodedCalls))
      //   .to.emit(greeterCaller, 'GREETING')
      //   .withArgs('Hello, Sir Paul McCartney');
  




        // [owner] = await ethers.getSigners();

        // let Oracle = await ethers.getContractFactory("OraclePath");

        // oracle = (await Oracle.deploy(ADDRESSES['FACTORY'])).connect(owner);

        // // Get the ContractFactory
        // Pool = await ethers.getContractFactory("Pool");

        // // To deploy our contract, we just have to call Pool.deploy() and await
        // // for it to be deployed(), which happens onces its transaction has been
        // // mined.
        // hardhatPool = (await Pool.deploy(ADDRESSES['ROUTER'], oracle.address)).connect(owner)

        // await hardhatPool.createIndex(
        //     tokens, // address[] _tokens
        //     tokens.map(() => 1000000000),  // uint256[] _allocation,
        //     tokens.map(x => [x, ADDRESSES['WMAIN']]), // paths
        // );

        // // DEPOSIT
        // let overrides = {value: ethers.utils.parseEther("10.")};
        // await hardhatPool.deposit(
        //     0, // _token_id
        //     tokens.map(x => [ADDRESSES['WMAIN'], x]), // paths
        //     overrides
        // );
    });

    it("Single Uniswap buy", async function () {
      var _bridgeAddresses = [uniswapV2SwapBridge.address];
      var _bridgeEncodedCalls = [
        uniswapV2SwapBridge.interface.encodeFunctionData("buy",
        [
          1,
          [ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]
        ])
      ];

      let overrides = {value: ethers.utils.parseEther("1.1")};
      const ret = await wallet.deposit(
        _bridgeAddresses,
        _bridgeEncodedCalls,
        overrides
      );
      // console.log(ret);



        // const prevBalance = await owner.getBalance();

        // // WITHDRAW
        // await hardhatPool.withdraw(
        //     [0],   // _token_id
        //     [100000], // _sell_pct
        //     tokens.map(x => [x, ADDRESSES['WMAIN']]) // paths
        // );

        // expect(await hardhatPool.getTokenBalance(0, tokens[0], owner.getAddress())).to.equal(0);
        // expect(await owner.getBalance()).to.be.above(prevBalance);
    })

});