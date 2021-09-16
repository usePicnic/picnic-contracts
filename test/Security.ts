import {expect} from "chai";
import {ethers} from "hardhat";

describe("Security analysis", function () {
    let owner;
    let TestBridge;
    let testBridge;
    let IndexPool;
    let indexPool;
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
    
    it("Try to change address calling UnsafeBridge from IndexPool", async function () {
        // Instantiate and deploy IndexPool
        IndexPool = await ethers.getContractFactory("TestIndexPool");
        indexPool = await IndexPool.deploy();

        let overrides = {
            from: owner.address,
            value: ethers.utils.parseEther("1")
        };
        await indexPool.createPortfolio(
            {'tokens': [], 'amounts': []},[],[],
            overrides
        );        
                    
        let walletAddress = await indexPool.walletOf(0);                 
        let wallet = await ethers.getContractAt("TestWallet", walletAddress);
        let ownerBeforeBridgeCall = await wallet.getIndexPool();

        // Execute bridge calls
        await indexPool.connect(owner).editPortfolio(
            0,
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        let ownerAfterBridgeCall = await wallet.getIndexPool();
        expect(ownerAfterBridgeCall).to.be.eq(ownerBeforeBridgeCall);
    })
    it("Try to change address calling UnsafeBridge directly from Wallet", async function () {
        // Instantiate Wallet
        const Wallet = await ethers.getContractFactory("TestWallet");
        const wallet = await Wallet.connect(owner).deploy();             
        
        let ownerBeforeBridgeCall = await wallet.getIndexPool();
        // Execute bridge calls 
        await wallet.connect(owner).useBridges(
            _bridgeAddresses,
            _bridgeEncodedCalls,
        );

        let ownerAfterBridgeCall = await wallet.getIndexPool();
        expect(ownerAfterBridgeCall).to.be.eq(ownerBeforeBridgeCall);
    })        
    
});

