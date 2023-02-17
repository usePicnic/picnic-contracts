import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

function getAllowIndex(
    slot,
    from,
    to
) {
    const allowTemp = ethers.utils.solidityKeccak256(
        ["uint256", "uint256"],
        [from, slot]
        );

    return ethers.utils.solidityKeccak256(
    ["uint256", "uint256"],
    [to, allowTemp]
    );
}

function getBalanceIndex(slot, from) {
    return ethers.utils.solidityKeccak256(
    ["uint256", "uint256"],
    [from, slot]
    );
    
  }

function generateTokenApprovalStateDiff(
    asset,
    from,
    to
  ) {
    const allowIndex = getAllowIndex(
      asset.allowSlot, 
      from,
      to
    );
  
    const balanceIndex = getBalanceIndex(
      asset.balanceSlot, 
      from,
    );
  
  
    const stateDiff = {
      [asset.address]: {
        stateDiff: {
          [allowIndex]: "0x" + "f".repeat(64),
          [balanceIndex]: "0x" + "f".repeat(64),
        },
      },
    };
  
    return stateDiff;
}

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

    describe("Simulator", function () {
        it("WMATIC -> USDC", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
            ];

            // Set path
            let pathUniswap = [
                TOKENS['WMAIN'],
                TOKENS['USDC'],
            ];

            // Set encoded calls
            var _bridgeEncodedCalls = [
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "swapTokenToToken",
                    [
                        100000,
                        1,
                        pathUniswap
                    ],
                ),
            ];

            
            const asset = {
                address: TOKENS['WMAIN'],
                allowSlot: 4,
                balanceSlot: 3
            }

            const from = owner.address;

            const stateOverrides = generateTokenApprovalStateDiff(
                asset,
                from,
                txSimulator.address
              );

            const txSimulatorData = await txSimulator.populateTransaction.simulatePicnicTx(
                {tokens:[TOKENS['WMAIN']], amounts:[ethers.utils.parseEther("100")]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                TOKENS['USDC'],
            );

            const callData = {
                from: owner.address,
                to: txSimulator.address,
                data: txSimulatorData.data,
            }

            const balance = await provider.send("eth_call", [
                callData,
                "latest",
                stateOverrides,
              ]);

            console.log('balance', balance.toNumber())
        
            expect(balance).to.be.above(0);
        })
    })
});