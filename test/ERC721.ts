import { expect } from "chai";
import { ethers } from "hardhat";

import constants from "../constants";

describe("ERC721", function () {

  let owner;
  let provider;
  let IndexPool;
  let indexPool;
  let aaveV2Bridge;
  let uniswapV2SwapBridge;
  let uniswapV2Router02;

  const ADDRESSES = constants['POLYGON'];
  const TOKENS = constants['POLYGON']['TOKENS'];

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    provider = await ethers.getDefaultProvider();

    IndexPool = await ethers.getContractFactory("IndexPool");
    indexPool = (await IndexPool.deploy()).connect(owner);

    let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
    uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();
    await uniswapV2SwapBridge.deployed();

    let AaveV2Bridge = await ethers.getContractFactory("AaveV2Bridge");
    aaveV2Bridge = await AaveV2Bridge.deploy();
    await aaveV2Bridge.deployed();

    uniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", ADDRESSES["UNISWAP_V2_ROUTER"]);

    // await indexPool.generatePool721(
    //   owner.getAddress(),
    //   1, // index_id
    //   [2, 3] // allocation
    // );
  });

  it("IndexPool - Mint NFT with 2 calls", async function () {
    var _bridgeAddresses = [
      uniswapV2SwapBridge.address,
      aaveV2Bridge.address,
    ];
    var _bridgeEncodedCalls = [
      uniswapV2SwapBridge.interface.encodeFunctionData(
        "tradeFromETHToTokens",
        [
          ADDRESSES['UNISWAP_V2_ROUTER'],
          1,
          [
            TOKENS['WMAIN'],
            TOKENS['DAI'],
          ]
        ],
      ),
      aaveV2Bridge.interface.encodeFunctionData(
        "deposit",
        [
          ADDRESSES['AAVE_V2_LENDING_POOL'],
          TOKENS['DAI'],
        ]
      )
    ];

    let overrides = { value: ethers.utils.parseEther("1.1") };
    await indexPool.mintPortfolio(
      [],
      [],
      _bridgeAddresses,
      _bridgeEncodedCalls,
      overrides
    );

    await expect(await indexPool.balanceOf(owner.address)).to.be.above(0);
  })

  it("IndexPool - Mint NFT with empty calls", async function () {
    var _bridgeAddresses = [];
    var _bridgeEncodedCalls = [];

    let overrides = { value: ethers.utils.parseEther("1.1") };
    await indexPool.mintPortfolio(
      [],
      [],
      _bridgeAddresses,
      _bridgeEncodedCalls,
      overrides
    );

    await expect(await indexPool.balanceOf(owner.address)).to.be.above(0);
  })

  it("IndexPool - Deposit DAI", async function () {
    var overrides = { value: ethers.utils.parseEther("11") };
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

    var _bridgeAddresses = [
      uniswapV2SwapBridge.address,
      aaveV2Bridge.address,
    ];
    var _bridgeEncodedCalls = [
      uniswapV2SwapBridge.interface.encodeFunctionData(
        "tradeFromETHToTokens",
        [
          ADDRESSES['UNISWAP_V2_ROUTER'],
          1,
          [
            TOKENS['WMAIN'],
            TOKENS['DAI'],
          ]
        ],
      ),
      aaveV2Bridge.interface.encodeFunctionData(
        "deposit",
        [
          ADDRESSES['AAVE_V2_LENDING_POOL'],
          TOKENS['DAI'],
        ]
      )
    ];

    let dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"]);
    let daiBalance = await dai.balanceOf(owner.address);
    console.log(daiBalance);
    await dai.approve(owner.address, daiBalance);
    
    await indexPool.mintPortfolio(
      [TOKENS["DAI"]],
      [daiBalance],
      _bridgeAddresses,
      _bridgeEncodedCalls
    );

    await expect(await indexPool.balanceOf(owner.address)).to.be.above(0);
  })

})

