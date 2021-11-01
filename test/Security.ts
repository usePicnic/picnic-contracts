import {expect} from "chai";
import {ethers} from "hardhat";

describe("Security analysis", function () {
    let owner;
    let TestBridge;
    let testBridge;
    let DeFiBasket;
    let defibasket;
    let _bridgeAddresses;
    let _bridgeEncodedCalls;
        
    beforeEach(async function () {
        // Get signer
        [owner, ] = await ethers.getSigners();

        // Instantiate Exploit bridge
        TestBridge = await ethers.getContractFactory("UnsafeBridge");
        testBridge = await TestBridge.deploy();       
        
        // Set bridge address
        _bridgeAddresses = [
            testBridge.address,
        ];
        
        // Set encoded calls
        _bridgeEncodedCalls = [
            testBridge.interface.encodeFunctionData(
                "HackWallet",
                [],
            ),
        ];        

    });
    
    it("Try to change address calling UnsafeBridge from DeFi Basket", async function () {
        // Instantiate and deploy DeFi Basket
        DeFiBasket = await ethers.getContractFactory("TestDeFiBasket");
        defibasket = await DeFiBasket.deploy();

        let overrides = {
            from: owner.address,
            value: ethers.utils.parseEther("1")
        };
        await defibasket.createPortfolio(
            {'tokens': [], 'amounts': []},[],[],
            overrides
        );        
                    
        let walletAddress = await defibasket.walletOf(0);                 
        let wallet = await ethers.getContractAt("TestWallet", walletAddress);
        let ownerBeforeBridgeCall = await wallet.getDeFiBasket();

        // Execute bridge calls
        await defibasket.connect(owner).editPortfolio(
            0,
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        let ownerAfterBridgeCall = await wallet.getDeFiBasket();
        expect(ownerAfterBridgeCall).to.be.eq(ownerBeforeBridgeCall);
    })
    it("Try to change address calling UnsafeBridge directly from Wallet", async function () {
        // Instantiate Wallet
        const Wallet = await ethers.getContractFactory("TestWallet");
        const wallet = await Wallet.connect(owner).deploy();             
        
        let ownerBeforeBridgeCall = await wallet.getDeFiBasket();
        // Execute bridge calls 
        await wallet.connect(owner).useBridges(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        let ownerAfterBridgeCall = await wallet.getDeFiBasket();
        expect(ownerAfterBridgeCall).to.be.eq(ownerBeforeBridgeCall);
    })        
    
});

