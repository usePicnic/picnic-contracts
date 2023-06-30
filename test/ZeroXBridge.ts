import { expect } from "chai";
import { ethers } from "hardhat";
import fetch from "node-fetch";

const ZEROX_ABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"quoteSigner","type":"address"}],"name":"QuoteSignerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"taker","type":"address"},{"indexed":false,"internalType":"address","name":"inputToken","type":"address"},{"indexed":false,"internalType":"address","name":"outputToken","type":"address"},{"indexed":false,"internalType":"uint256","name":"inputTokenAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"outputTokenAmount","type":"uint256"}],"name":"TransformedERC20","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"transformerDeployer","type":"address"}],"name":"TransformerDeployerUpdated","type":"event"},{"inputs":[],"name":"FEATURE_NAME","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"FEATURE_VERSION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address payable","name":"taker","type":"address"},{"internalType":"contract IERC20TokenV06","name":"inputToken","type":"address"},{"internalType":"contract IERC20TokenV06","name":"outputToken","type":"address"},{"internalType":"uint256","name":"inputTokenAmount","type":"uint256"},{"internalType":"uint256","name":"minOutputTokenAmount","type":"uint256"},{"components":[{"internalType":"uint32","name":"deploymentNonce","type":"uint32"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct ITransformERC20Feature.Transformation[]","name":"transformations","type":"tuple[]"},{"internalType":"bool","name":"useSelfBalance","type":"bool"},{"internalType":"address payable","name":"recipient","type":"address"}],"internalType":"struct ITransformERC20Feature.TransformERC20Args","name":"args","type":"tuple"}],"name":"_transformERC20","outputs":[{"internalType":"uint256","name":"outputTokenAmount","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"createTransformWallet","outputs":[{"internalType":"contract IFlashWallet","name":"wallet","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getQuoteSigner","outputs":[{"internalType":"address","name":"signer","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTransformWallet","outputs":[{"internalType":"contract IFlashWallet","name":"wallet","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTransformerDeployer","outputs":[{"internalType":"address","name":"deployer","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"transformerDeployer","type":"address"}],"name":"migrate","outputs":[{"internalType":"bytes4","name":"success","type":"bytes4"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"quoteSigner","type":"address"}],"name":"setQuoteSigner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"transformerDeployer","type":"address"}],"name":"setTransformerDeployer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20TokenV06","name":"inputToken","type":"address"},{"internalType":"contract IERC20TokenV06","name":"outputToken","type":"address"},{"internalType":"uint256","name":"inputTokenAmount","type":"uint256"},{"internalType":"uint256","name":"minOutputTokenAmount","type":"uint256"},{"components":[{"internalType":"uint32","name":"deploymentNonce","type":"uint32"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct ITransformERC20Feature.Transformation[]","name":"transformations","type":"tuple[]"}],"name":"transformERC20","outputs":[{"internalType":"uint256","name":"outputTokenAmount","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"contract IERC20TokenV06","name":"inputToken","type":"address"},{"internalType":"contract IERC20TokenV06","name":"outputToken","type":"address"},{"internalType":"uint256","name":"inputTokenAmount","type":"uint256"},{"internalType":"uint256","name":"minOutputTokenAmount","type":"uint256"},{"components":[{"internalType":"uint32","name":"deploymentNonce","type":"uint32"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct ITransformERC20Feature.Transformation[]","name":"transformations","type":"tuple[]"}],"name":"transformERC20Staging","outputs":[{"internalType":"uint256","name":"outputTokenAmount","type":"uint256"}],"stateMutability":"payable","type":"function"}]

describe("ZeroX", function(){
  let owner;
  let other;
  let zeroXBridge;
  let wallet;
  let wmaticBridge;
  
  this.beforeEach(async function() {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Paraswap bridge
        const ZeroXBridge = await ethers.getContractFactory("ZeroXBridge");
        zeroXBridge = await ZeroXBridge.deploy();

        // Instantiate WMatic bridge
        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
  });

  describe("Actions", function() {
    it("Trade WMATIC for USDC", async function () {
        const sellToken = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
        const buyToken = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
        const sellAmount = ethers.utils.parseEther("1").toString();
        const priceUrl = `https://polygon.api.0x.org/swap/v1/quote?buyToken=${buyToken}&sellToken=${sellToken}&sellAmount=${sellAmount}`;

        const req = await fetch(priceUrl);
        const body = await req.json();
     
        console.log('zx', body)      
    
       // TODO wtf is the allowance target?
       const zerox = new ethers.Contract(body.to, ZEROX_ABI);
        
        const functionCallBytes = body.data;
        const decodedFunctionCall = zerox.interface.parseTransaction({
            data: functionCallBytes,
        });
        
        console.log(decodedFunctionCall);
        console.log('zz', decodedFunctionCall.args[4]);


        // Set bridges addresses
        var _bridgeAddresses = [wmaticBridge.address, zeroXBridge.address];

        // Set encoded calls
        var _bridgeEncodedCalls = [
            wmaticBridge.interface.encodeFunctionData("wrap", [100000]),
            zeroXBridge.interface.encodeFunctionData("swap", [
                body.to,
                decodedFunctionCall.args[0],
                decodedFunctionCall.args[1],
                "100000",
                "1",
                decodedFunctionCall.args[4]
            ])
        ];
        
        // Transfer money to wallet (similar as DeFi Basket contract would have done)
        const transactionHash = await owner.sendTransaction({
          to: wallet.address,
          value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
        });
        await transactionHash.wait();

        // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
        await wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);

        // Wallet DAI amount should be 0
        let lpToken = await ethers.getContractAt(
            "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
            buyToken
        );
        let lpTokenBalance = await lpToken.balanceOf(wallet.address);
        expect(lpTokenBalance).to.be.above(0);
    });
  });
});