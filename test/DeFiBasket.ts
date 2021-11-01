import {expect} from "chai";
import {ethers} from "hardhat";
import { getFirstEvent } from "./utils";
import constants from "../constants";

describe("DeFi Basket", function () {
    let owner;
    let other;
    let provider;
    let DeFiBasket;
    let defibasket;
    let uniswapV2SwapBridge;
    let uniswapV2Router02;
    let wmaticBridge;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        [owner, other] = await ethers.getSigners();
        provider = await ethers.getDefaultProvider();

        DeFiBasket = await ethers.getContractFactory("DeFiBasket");
        defibasket = await DeFiBasket.deploy();

        let UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        uniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", ADDRESSES["UNISWAP_V2_ROUTER"]);
    });

    describe("Create portfolio", function () {
        it("Create portfolio - with a deposit on ETH", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Wait transaction to complete
            tx.wait();

            // Wallet ETH balance should be above 0
            let walletAddress = await defibasket.walletOf(0);
            let walletBalance = await ethers.provider.getBalance(walletAddress);
            expect(walletBalance).to.be.above(0);
        })
        it("Create portfolio - with a Deposit on DAI", async function () {
            // Buy DAI on Uniswap
            var overrides = {value: ethers.utils.parseEther("1")};
            let blockNumber = await provider.getBlockNumber();
            let block = await provider.getBlock(blockNumber);

            await uniswapV2Router02.swapExactETHForTokens(
                1,
                [
                    TOKENS['WMAIN'],
                    TOKENS['DAI'],
                ],
                owner.address,
                block.timestamp + 100000,
                overrides
            )

            // Get DAI balance
            let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"]));
            let daiBalance = await dai.balanceOf(owner.address);
            await dai.approve(defibasket.address, daiBalance);

            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [TOKENS['DAI']], 'amounts': [daiBalance]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wait transaction to complete
            tx.wait();

            // Wallet DAI balance should be above 0
            let walletAddress = await defibasket.walletOf(0);
            let walletDaiBalance = await dai.balanceOf(walletAddress);
            expect(walletDaiBalance).to.be.above(0);
        })
        it("Rejects mismatch in array size for input tokens and amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio
            await expect(defibasket.createPortfolio(
                {'tokens': [TOKENS['DAI'], TOKENS['QUICK']], 'amounts': [100]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("DEFIBASKET: MISMATCH IN LENGTH BETWEEN TOKENS AND AMOUNTS");
        })

        it("Rejects ERC20 amounts equal to zero", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio
            await expect(defibasket.createPortfolio(
                {'tokens': [TOKENS['DAI']], 'amounts': [0]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("DEFIBASKET WALLET: ERC20 TOKEN AMOUNTS NEED TO BE > 0");
        })

        it("Rejects no ETH amounts along with empty ERC20 amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio
            await expect(defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls
            )).to.be.revertedWith("DEFIBASKET: AN AMOUNT IN ETHER OR ERC20 TOKENS IS NEEDED");
        })

        it("Rejects different bridges and calls sizes", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [uniswapV2Router02.address];
            var _bridgeEncodedCalls = [];

            // Create a portfolio
            await expect(defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")}
            )).to.be.revertedWith("DEFIBASKET: BRIDGE ENCODED CALLS AND ADDRESSES MUST HAVE THE SAME LENGTH");
        })
    });

    describe("Deposit in a portfolio", function () {
        it("Deposit in a portfolio - with a deposit on ETH", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Wait transaction to complete
            tx.wait()
            // Code above was tested elsewhere

            // Wallet ETH balance should be above 0
            let walletAddress = await defibasket.walletOf(0);
            let previousWalletBalance = await ethers.provider.getBalance(walletAddress);

            // Deposit in a portfolio
            await defibasket.depositPortfolio(
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

        it("Deposit in a portfolio - with a deposit on DAI", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Buy DAI on Uniswap
            var overrides = {value: ethers.utils.parseEther("1")};
            let blockNumber = await provider.getBlockNumber();
            let block = await provider.getBlock(blockNumber);

            await uniswapV2Router02.swapExactETHForTokens(
                1,
                [
                    TOKENS['WMAIN'],
                    TOKENS['DAI'],
                ],
                owner.address,
                block.timestamp + 100000,
                overrides
            )

            // Get DAI balance
            let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"]));
            let daiBalance = await dai.balanceOf(owner.address);
            await dai.approve(defibasket.address, daiBalance);

            // Deposit in a portfolio
            let tx = await defibasket.depositPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [TOKENS['DAI']], 'amounts': [daiBalance]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wait for deposit to happen :)
            tx.wait();

            // Wallet DAI balance should be above 0
            let walletAddress = await defibasket.walletOf(0);
            let walletDaiBalance = await dai.balanceOf(walletAddress);
            expect(walletDaiBalance).to.be.above(0);
        })

        it("Rejects other address depositing in NFT", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            let otherDeFiBasket = defibasket.connect(other);

            await expect(otherDeFiBasket.depositPortfolio(
                0,
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("DEFIBASKET: ONLY NFT OWNER CAN CALL THIS FUNCTION");
        })

        it("Rejects mismatch in array size for input tokens and amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(defibasket.depositPortfolio(
                0,
                {'tokens': [TOKENS['DAI'], TOKENS['QUICK']], 'amounts': [100]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("DEFIBASKET: MISMATCH IN LENGTH BETWEEN TOKENS AND AMOUNTS");
        })

        it("Rejects ERC20 amounts equal to zero", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(defibasket.depositPortfolio(
                0,
                {'tokens': [TOKENS['DAI']], 'amounts': [0]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("DEFIBASKET WALLET: ERC20 TOKEN AMOUNTS NEED TO BE > 0");
        })

        it("Rejects no ETH amounts along with empty ERC20 amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(defibasket.depositPortfolio(
                0,
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("DEFIBASKET: AN AMOUNT IN ETHER OR ERC20 TOKENS IS NEEDED");
        })

        it("Rejects different bridges and calls sizes", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Set bridges addresses and encoded calls
            _bridgeAddresses = [uniswapV2Router02.address];

            // Create a portfolio
            await expect(defibasket.depositPortfolio(
                0,
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("DEFIBASKET: BRIDGE ENCODED CALLS AND ADDRESSES MUST HAVE THE SAME LENGTH");
        })
    });

    describe("Edits portfolio", function () {
        it("Edits portfolio - swaps ETH for DAI", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Wait transaction to complete
            tx.wait()
            // Code above was tested elsewhere

            _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
            ];

            // Set path
            let pathUniswap = [
                TOKENS['WMAIN'],
                TOKENS['DAI'],
            ];

            // Set encoded calls
            _bridgeEncodedCalls = [
                wmaticBridge.interface.encodeFunctionData(
                    "wrap",
                    [
                        100000
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        pathUniswap
                    ],
                ),
            ];

            // Deposit in a portfolio
            await defibasket.editPortfolio(
                0, // NFT ID - NFT created just above
                _bridgeAddresses,
                _bridgeEncodedCalls
            );

            let walletAddress = await defibasket.walletOf(0);

            // Wallet DAI amount should be 0
            let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"])
            let daiBalance = await dai.balanceOf(walletAddress);
            expect(daiBalance).to.be.above(0);
        })

        it("Rejects other address editing NFT", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            let otherDeFiBasket = defibasket.connect(other);

            await expect(otherDeFiBasket.editPortfolio(
                0,
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("DEFIBASKET: ONLY NFT OWNER CAN CALL THIS FUNCTION");
        })

        it("Rejects different bridges and calls sizes", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Set bridges addresses and encoded calls
            _bridgeAddresses = [uniswapV2Router02.address];

            // Create a portfolio
            await expect(defibasket.editPortfolio(
                0,
                _bridgeAddresses,
                _bridgeEncodedCalls
            )).to.be.revertedWith("DEFIBASKET: BRIDGE ENCODED CALLS AND ADDRESSES MUST HAVE THE SAME LENGTH");
        })
    });

    describe("Withdraw from portfolio", function () {
        it("Withdraw from portfolio - in ETH", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );
            // Code above was tested elsewhere

            // Get ETH balance in owner's wallet before calling withdraw
            let previousBalance = await owner.getBalance()

            // Withdraw from portfolio
            await defibasket.withdrawPortfolio(
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

        it("Withdraw from portfolio - in DAI", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
            ];

            // Set path
            let pathUniswap = [
                TOKENS['WMAIN'],
                TOKENS['DAI'],
            ];

            // Set encoded calls
            var _bridgeEncodedCalls = [
                wmaticBridge.interface.encodeFunctionData(
                    "wrap",
                    [
                        100000
                    ],
                ),
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        pathUniswap
                    ],
                ),
            ];

            // Create a portfolio (just holds ether)
            await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );
            // Code above was tested elsewhere

            // Get DAI balance in owner's wallet before calling withdraw
            let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"]));
            let previousDaiBalance = await dai.balanceOf(owner.address);

            // Withdraw from portfolio
            await defibasket.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [TOKENS['DAI']], 'amounts': [100000]}, // outputs
                0, // Withdraw percentage
                [], // _bridgeAddresses
                [], // _encodedBridgeCalls
            );

            // Get ETH balance in owner's wallet after calling withdraw
            let currentDaiBalance = await dai.balanceOf(owner.address);

            // Balance after withdrawing should be higher than before
            expect(currentDaiBalance).to.be.above(previousDaiBalance);
        })

        it("Rejects other address withdrawing from NFT", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            let otherDeFiBasket = defibasket.connect(other);

            await expect(otherDeFiBasket.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [], 'amounts': []},
                100000, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("DEFIBASKET: ONLY NFT OWNER CAN CALL THIS FUNCTION");
        })

        it("Rejects mismatch in array size for output tokens and amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(defibasket.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [TOKENS['DAI'], TOKENS['QUICK']], 'amounts': [100]},
                100000, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("DEFIBASKET: MISMATCH IN LENGTH BETWEEN TOKENS AND AMOUNTS");
        })

        it("Rejects ERC20 amounts equal to zero", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(defibasket.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [TOKENS['DAI']], 'amounts': [0]},
                100000, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("DEFIBASKET WALLET: ERC20 TOKEN AMOUNTS NEED TO BE > 0");
        })

        it("Rejects no ETH amounts along with empty ERC20 amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(defibasket.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [], 'amounts': []},
                0, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("DEFIBASKET: AN AMOUNT IN ETHER OR ERC20 TOKENS IS NEEDED");
        })

        it("Rejects different bridges and calls sizes", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Set bridges addresses and encoded calls
            _bridgeAddresses = [uniswapV2Router02.address];

            // Create a portfolio
            await expect(defibasket.withdrawPortfolio(
                0,
                {'tokens': [], 'amounts': []},
                100000, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls
            )).to.be.revertedWith("DEFIBASKET: BRIDGE ENCODED CALLS AND ADDRESSES MUST HAVE THE SAME LENGTH");
        })
    });
    describe("NFT URI", function () {
        it("Sets and reads Base URI", async function () {
            await defibasket.createPortfolio(
                {'tokens': [], 'amounts': []},
                [],
                [],
                {value: ethers.utils.parseEther("1")} // overrides
            );

            await defibasket.setBaseURI('defibasket-test/');

            expect(await defibasket.tokenURI(0)).to.be.equal('defibasket-test/0');
        })
    })
    // describe("Events", function () {
    //     it("Emits DEFIBASKET_MINT_NFT", async function () {
    //         // Set bridges addresses and encoded calls
    //         var _bridgeAddresses = [];
    //         var _bridgeEncodedCalls = [];
    //
    //         // Create a portfolio (just holds ether)
    //         await indexpool.createPortfolio(
    //             {'tokens': [], 'amounts': []},
    //             _bridgeAddresses,
    //             _bridgeEncodedCalls,
    //             {value: ethers.utils.parseEther("1")} // overrides
    //         );
    //
    //         var event = await getFirstEvent({ address: indexpool.address }, IndexPool, 'DEFIBASKET_MINT_NFT');
    //
    //         // First NFT created has ID 0
    //         expect(event.args.nftId).to.be.equal(0);
    //         expect(event.args.wallet).to.equal(await indexpool.walletOf(0));
    //         expect(event.args.nftOwner).to.eql(await indexpool.ownerOf(0));
    //     })
    //
    //     it("Emits DEFIBASKET_DEPOSIT", async function () {
    //         // Buy DAI on Uniswap
    //         var overrides = {value: ethers.utils.parseEther("1")};
    //         let blockNumber = await provider.getBlockNumber();
    //         let block = await provider.getBlock(blockNumber);
    //
    //         await uniswapV2Router02.swapExactETHForTokens(
    //             1,
    //             [
    //                 TOKENS['WMAIN'],
    //                 TOKENS['DAI'],
    //             ],
    //             owner.address,
    //             block.timestamp + 100000,
    //             overrides
    //         )
    //
    //         // Get DAI balance
    //         let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"]));
    //         let daiBalance = await dai.balanceOf(owner.address);
    //         await dai.approve(indexpool.address, daiBalance);
    //
    //         // Set bridges addresses and encoded calls
    //         var _bridgeAddresses = [];
    //         var _bridgeEncodedCalls = [];
    //
    //         // Create a portfolio (just holds ether)
    //         await indexpool.createPortfolio(
    //             {'tokens': [TOKENS['DAI']], 'amounts': [daiBalance]},
    //             _bridgeAddresses,
    //             _bridgeEncodedCalls,
    //             {value: ethers.utils.parseEther("1")} // overrides
    //         );
    //
    //         var event = await getFirstEvent({ address: indexpool.address }, IndexPool, 'DEFIBASKET_DEPOSIT');
    //
    //         // First NFT created has ID 0
    //         expect(event.args.nftId).to.be.equal(0);
    //
    //         // Checking ERC20 inputs
    //         expect(event.args.inputTokens[0]).to.equal(TOKENS['DAI']);
    //         expect(event.args.inputTokens.length).to.equal(1);
    //         expect(event.args.inputAmounts[0]).to.eql(daiBalance);
    //         expect(event.args.inputAmounts.length).to.eql(1);
    //
    //         // Checking ETH inputs
    //         expect(event.args.ethAmount).to.be.equal(ethers.utils.parseEther("1"));
    //     })
    //
    //     it("Emits DEFIBASKET_WITHDRAW", async function () {
    //
    //         // Set bridges addresses
    //         var _bridgeAddresses = [
    //             wmaticBridge.address,
    //             uniswapV2SwapBridge.address,
    //         ];
    //
    //         // Set path
    //         let pathUniswap = [
    //             TOKENS['WMAIN'],
    //             TOKENS['DAI'],
    //         ];
    //
    //         // Set encoded calls
    //         var _bridgeEncodedCalls = [
    //             wmaticBridge.interface.encodeFunctionData(
    //                 "wrap",
    //                 [
    //                     50000
    //                 ],
    //             ),
    //             uniswapV2SwapBridge.interface.encodeFunctionData(
    //                 "swapTokenToToken",
    //                 [
    //                     100000,
    //                     1,
    //                     pathUniswap
    //                 ],
    //             ),
    //         ];
    //
    //         // Create a portfolio (just holds ether)
    //         await indexpool.createPortfolio(
    //             {'tokens': [], 'amounts': []},
    //             _bridgeAddresses,
    //             _bridgeEncodedCalls,
    //             {value: ethers.utils.parseEther("1")} // overrides
    //         );
    //
    //         let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"]));
    //         let daiBalance = await dai.balanceOf(indexpool.walletOf(0));
    //
    //         // Withdraw from portfolio
    //         await indexpool.withdrawPortfolio(
    //             0, // NFT ID - NFT created just above
    //             {'tokens': [TOKENS['DAI']], 'amounts': [100000]}, // outputs
    //             100000, // Withdraw ETH percentage
    //             [], // _bridgeAddresses
    //             [], // _encodedBridgeCalls
    //         );
    //
    //         var event = await getFirstEvent({ address: indexpool.address }, IndexPool, 'DEFIBASKET_WITHDRAW');
    //
    //         // First NFT created has ID 0
    //         expect(event.args.nftId).to.be.equal(0);
    //
    //         // Checking ERC20 inputs
    //         expect(event.args.outputTokens[0]).to.equal(TOKENS['DAI']);
    //         expect(event.args.outputTokens.length).to.be.equal(1);
    //         expect(event.args.outputAmounts[0]).to.eql(daiBalance);
    //         expect(event.args.outputAmounts.length).to.equal(1);
    //
    //         // Checking ETH inputs
    //         expect(event.args.ethAmount).to.be.above(ethers.utils.parseEther("0.49"));
    //     })
    // })
});