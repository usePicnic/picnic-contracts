import {expect} from "chai";
import {ethers} from "hardhat";
import { getFirstEvent } from "./utils";
import constants from "../constants";

describe("TxSimulator", function () {
    let owner : any;
    let other : any;
    let provider : any;
    let uniswapV2SwapBridge : any;
    let uniswapV2Router02 : any;
    let wmaticBridge : any;
    let txSimulator : any;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        [owner, other] = await ethers.getSigners();
        provider = await ethers.getDefaultProvider();

        const TxSimulator = await ethers.getContractFactory("TxSimulator");
        txSimulator = await TxSimulator.deploy() as any;

        let UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy() as any;

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy() as any;

        uniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", ADDRESSES["UNISWAP_V2_ROUTER"]);
    });

    describe("From Network Token", function () {
        it("WMATIC -> USDC", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
            ];

            // Set path
            let pathUniswap = [
                TOKENS['WMAIN'],
                TOKENS['USDC'],
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

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            const balance = await txSimulator.callStatic.simulateFromNetworkToken(
                {tokens:[], amounts:[]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                TOKENS['USDC'],
                {value: ethers.utils.parseEther("100")} // overrides
            );
            // const tx = await pendingTx.wait();
            console.log('balance', balance.toNumber())
        
            expect(balance).to.be.above(0);
        })
    })

    describe("From Token", function () {
        it("DAI -> USDC", async function () {
            // Set bridges addresses
            const _bridgeAddresses = [
                wmaticBridge.address,
                uniswapV2SwapBridge.address,
            ];

            // Set path
            const pathUniswap = [
                TOKENS['WMAIN'],
                TOKENS['DAI'],
            ];

            // Set encoded calls
            const _bridgeEncodedCalls = [
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

        
        // Bridge addresses
        const _bridgeAddressesII = [
            uniswapV2SwapBridge.address,
        ];

        // Set path
        const pathUniswapII = [
            TOKENS['DAI'],
            TOKENS['USDC'],
        ];

        // Set encoded calls
        const _bridgeEncodedCallsII = [
            uniswapV2SwapBridge.interface.encodeFunctionData(
                "swapTokenToToken",
                [
                    100000,
                    1,
                    pathUniswapII
                ],
            ),
        ];

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            const balance = await txSimulator.callStatic.simulateFromAnyToken(
                {tokens:[], amounts:[]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                TOKENS['DAI'],
                ethers.utils.parseEther("1"),
                _bridgeAddressesII,
                _bridgeEncodedCallsII,
                TOKENS['USDC'],
                {value: ethers.utils.parseEther("100")} // overrides
            );
            // const tx = await pendingTx.wait();
            console.log('balance', balance.toNumber())
        
            expect(balance).to.be.above(0);
        })
    })
});