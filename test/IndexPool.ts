import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";


describe("IndexPool", function () {
    let owner;
    let other;
    let provider;
    let IndexPool;
    let indexpool;
    let uniswapV2SwapBridge;
    let uniswapV2Router02;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        [owner, other] = await ethers.getSigners();
        provider = await ethers.getDefaultProvider();

        IndexPool = await ethers.getContractFactory("IndexPool");
        indexpool = await IndexPool.deploy();

        let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        uniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", ADDRESSES["UNISWAP_V2_ROUTER"]);
    });

    it("Create portfolio", async function () {
        // Set bridges addresses and encoded calls
        var _bridgeAddresses = [];
        var _bridgeEncodedCalls = [];

        // Create a portfolio (just holds ether)
        let tx = await indexpool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            {value: ethers.utils.parseEther("1")} // overrides
        );

        // Wait transaction to complete
        tx.wait();

        // Wallet ETH balance should be above 0
        let walletAddress = await indexpool.walletOf(0);
        let walletBalance = await ethers.provider.getBalance(walletAddress);
        expect(walletBalance).to.be.above(0);
    })

    it("Deposit in a portfolio", async function () {
        // Set bridges addresses and encoded calls
        var _bridgeAddresses = [];
        var _bridgeEncodedCalls = [];

        // Create a portfolio (just holds ether)
        let tx = await indexpool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            {value: ethers.utils.parseEther("1")} // overrides
        );

        // Wait transaction to complete
        tx.wait()
        // Code above was tested elsewhere

        // Wallet ETH balance should be above 0
        let walletAddress = await indexpool.walletOf(0);
        let previousWalletBalance = await ethers.provider.getBalance(walletAddress);

        // Deposit in a portfolio
        await indexpool.depositPortfolio(
            0, // NFT ID - NFT created just above
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            {value: ethers.utils.parseEther("1")} // overrides
        );

        // Wallet ETH balance should be above 0
        let currentWalletBalance = await ethers.provider.getBalance(walletAddress);
        expect(currentWalletBalance).to.be.above(previousWalletBalance);
    })

    // TODO deposit DAI in a portfolio
    it("Withdraw from portfolio", async function () {
        // Set bridges addresses and encoded calls
        var _bridgeAddresses = [];
        var _bridgeEncodedCalls = [];

        // Create a portfolio (just holds ether)
        await indexpool.createPortfolio(
            {'tokens': [], 'amounts': []},
            _bridgeAddresses,
            _bridgeEncodedCalls,
            {value: ethers.utils.parseEther("1")} // overrides
        );
        // Code above was tested elsewhere

        // Get ETH balance in owner's wallet before calling withdraw
        let previousBalance = await owner.getBalance()

        // Withdraw from portfolio
        await indexpool.withdrawPortfolio(
            0, // NFT ID - NFT created just above
            {'tokens': [], 'amounts': []},
            100000, // Withdraw percentage
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        // Get ETH balance in owner's wallet after calling withdraw
        let currentBalance = await owner.getBalance()

        // Balance after withdrawing should be higher than before
        expect(currentBalance).to.be.above(previousBalance);
    })
});