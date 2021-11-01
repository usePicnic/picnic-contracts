// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "./interfaces/IDeFiBasket.sol";
import "./Wallet.sol";
import "./libraries/DBDataTypes.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title DeFiBasket
 * @author DeFi Basket
 *
 * @notice Coordinates portfolio creation, deposits/withdrawals, and fee payments.
 *
 * @dev This contract has 3 main functions:
 *
 * 1. Mint and manage NFTs
 * 1.1 Track ownership of NFTs
 * 1.2 Track NFT and Wallet relationship
 * 2. Create and manage wallets
 * 2.1 Control deposits / withdrawals to wallets
 * 2.2 Control the permissions for delegate calls to bridges
 * 3. Collect fees for the DeFi Basket protocol
 */

contract DeFiBasket is IDeFiBasket, ERC721, Ownable {
    using SafeERC20 for IERC20;

    // Modifiers
    modifier onlyNFTOwner(uint256 nftId) {
        require(
            msg.sender == ownerOf(nftId),
            "DEFIBASKET: ONLY NFT OWNER CAN CALL THIS FUNCTION"
        );
        _;
    }

    modifier checkInputs(DBDataTypes.TokenData calldata inputs, uint256 ethAmount) {
        require(
            inputs.tokens.length == inputs.amounts.length,
            "DEFIBASKET: MISMATCH IN LENGTH BETWEEN TOKENS AND AMOUNTS"
        );
        for (uint16 i = 0; i < inputs.amounts.length; i++) {
            require(
                inputs.amounts[i] > 0,
                "DEFIBASKET WALLET: ERC20 TOKEN AMOUNTS NEED TO BE > 0"
            );
        }
        require(
            inputs.amounts.length > 0 || ethAmount > 0, // ERC20 Tokens or ETH is needed
            "DEFIBASKET: AN AMOUNT IN ETHER OR ERC20 TOKENS IS NEEDED"
        );
        _;
    }

    modifier checkBridgeCalls(address[] calldata bridgeAddresses, bytes[] calldata bridgeEncodedCalls) {
        require(
            bridgeAddresses.length == bridgeEncodedCalls.length,
            "DEFIBASKET: BRIDGE ENCODED CALLS AND ADDRESSES MUST HAVE THE SAME LENGTH"
        );
        _;
    }

    // NFT properties
    uint256 public tokenCounter = 0;
    mapping(uint256 => address) private _nftIdToWallet;
    string _nftImageURI = "https://www.defibasket.org/api/get-nft-metadata/";

    // Address of the implementation of the Wallet contract
    address immutable implementationWalletAddress;    

    // Constructor
    constructor() ERC721("DeFi Basket NFT", "BASKETNFT") Ownable() {
        // Deploy a Wallet implementation that will be used as template for clones
        implementationWalletAddress = address(new Wallet());
    }

    // External functions

    /**
     * @notice Returns wallet address of a given NFT Id.
     *
     * @dev Each NFT Id is associated to its own Wallet, which is a contract
     * that holds funds separately from other users' funds.
     *
     * @param nftId NFT Id
     */
    function walletOf(uint256 nftId) public view returns (address)  {
        return _nftIdToWallet[nftId];
    }

    /**
     * @notice Create a portfolio.
     *
     * @dev The first step to create a portfolio is composed of 3 steps:
     *
     * 1. Mint an NFT and Wallet for the corresponding NFT.
     * 2. Transfer resources (ETH and ERC20 tokens) to Wallet.
     * 3. Process bridge calls (interact with Uniswap/Aave...).
     *
     * @param inputs ERC20 token addresses and amounts that will enter the contract
     * @param bridgeAddresses Addresses of deployed bridge contracts
     * @param bridgeEncodedCalls Encoded calls to be passed on to delegate calls
     */
    function createPortfolio(
        DBDataTypes.TokenData calldata inputs,
        address[] calldata bridgeAddresses,
        bytes[] calldata bridgeEncodedCalls
    ) payable external
        checkInputs(inputs, msg.value)
        checkBridgeCalls(bridgeAddresses, bridgeEncodedCalls) override
    {
        uint256 nftId = _mintNFT(msg.sender);

        _depositToWallet(nftId, inputs, msg.value);
        _writeToWallet(nftId, bridgeAddresses, bridgeEncodedCalls);
    }

    /**
     * @notice Deposit more funds into an existing portfolio.
     *
     * @dev The deposit function is composed of 2 steps:
     *
     * 1. Transfer resources (ETH and ERC20 tokens) to Wallet.
     * 2. Process bridge calls (interact with Uniswap/Aave...).
     *
     * @param nftId NFT Id
     * @param inputs ERC20 token addresses and amounts that will enter the contract
     * @param bridgeAddresses Addresses of deployed bridge contracts
     * @param bridgeEncodedCalls Encoded calls to be passed on to delegate calls
     */
    function depositPortfolio(
        uint256 nftId,
        DBDataTypes.TokenData calldata inputs,
        address[] calldata bridgeAddresses,
        bytes[] calldata bridgeEncodedCalls
    ) payable external
        checkInputs(inputs, msg.value)
        checkBridgeCalls(bridgeAddresses, bridgeEncodedCalls)
        onlyNFTOwner(nftId) override
    {
        emit DEFIBASKET_DEPOSIT();

        _depositToWallet(nftId, inputs, msg.value);
        _writeToWallet(nftId, bridgeAddresses, bridgeEncodedCalls);
    }

    /**
     * @notice Edit positions of an existing portfolio. No deposits or withdrawals allowed.
     *
     * @dev This functions only processes bridge calls, no deposits or withdrawals on the wallet.
     *
     * @param nftId NFT Id
     * @param bridgeAddresses Addresses of deployed bridge contracts
     * @param bridgeEncodedCalls Encoded calls to be passed on to delegate calls
     */
    function editPortfolio(
        uint256 nftId,
        address[] calldata bridgeAddresses,
        bytes[] calldata bridgeEncodedCalls
    ) external
        checkBridgeCalls(bridgeAddresses, bridgeEncodedCalls)
        onlyNFTOwner(nftId) override
    {
        emit DEFIBASKET_EDIT();

        _writeToWallet(nftId, bridgeAddresses, bridgeEncodedCalls);
    }

    /**
    * @notice Deposit more funds into an existing portfolio.
    *
    * @dev The withdraw function is composed of 3 steps:
    *
    * 1. Process bridge calls (interact with Uniswap/Aave...).
    * 2. Transfer resources (ETH and ERC20 tokens) to NFT owner.
    *
    * @param nftId NFT Id
    * @param outputs ERC20 token addresses and percentages that will exit the contract
    * @param outputEthPercentage percentage of ETH in portfolio that will exit the contract
    * @param bridgeAddresses Addresses of deployed bridge contracts
    * @param bridgeEncodedCalls Encoded calls to be passed on to delegate calls
    */
    function withdrawPortfolio(
        uint256 nftId,
        DBDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata bridgeAddresses,
        bytes[] calldata bridgeEncodedCalls
    ) external
        checkInputs(outputs, outputEthPercentage)
        checkBridgeCalls(bridgeAddresses, bridgeEncodedCalls)
        onlyNFTOwner(nftId) override
    {
        _writeToWallet(nftId, bridgeAddresses, bridgeEncodedCalls);
        _withdrawFromWallet(nftId, outputs, outputEthPercentage);
    }

    // Internal functions

    /**
     * @notice Mints an NFT given an NFT owner.
     *
     * @dev All NFTs inside this contract have a wallet linked to it. So, whenever an NFT is minted a new wallet is
     * created that will hold funds that corresponds to the portfolio owned by this NFT.
     *
     * @param nftOwner address of NFT owner
     */
    function _mintNFT(address nftOwner) internal returns (uint256){
        // Clone Wallet using implementation Wallet as template
        // See https://eips.ethereum.org/EIPS/eip-1167 for reference
        address walletAddress = Clones.clone(implementationWalletAddress);
        
        // Save NFT data
        uint256 nftId = tokenCounter;
        _nftIdToWallet[nftId] = walletAddress;
        tokenCounter = tokenCounter + 1;

        // Mint NFT
        _safeMint(nftOwner, nftId);

        emit DEFIBASKET_CREATE(nftId, walletAddress);

        return nftId;
    }

    /**
      * @notice Transfer deposited ETH and ERC20 tokens to the Wallet linked to the referenced NFT.
      *
      * @dev Transfer assets to the corresponding Wallet going through the following steps:
      * 1. Transfer deposited ETH into the DeFi Basket contract to the Wallet contract.
      * 2. Transfer approved ERC20 tokens from the user account to the Wallet contract.
      * 3. Charge 0.1% fee for DeFi Basket
      *
      * @param nftId NFT Id
      * @param inputs ERC20 token addresses and amounts that entered the contract and will go to Wallet
      * @param ethAmount ETH amount that entered the contract and will go to Wallet
      */
    function _depositToWallet(
        uint256 nftId,
        DBDataTypes.TokenData calldata inputs,
        uint256 ethAmount
    ) internal {
        // Pay 0.1% fee on ETH deposit to DeFi Basket
        address defibasketContractOwner = owner();
        uint256 defibasketFee = ethAmount / 1000;
        payable(defibasketContractOwner).call{value: defibasketFee}("");

        // Transfer 99.9% of ETH deposit to Wallet
        address walletAddress = walletOf(nftId);
        payable(walletAddress).call{value: ethAmount - defibasketFee}("");

        // For each ERC20: Charge 0.1% DeFi Basket fee and transfer tokens to Wallet
        for (uint16 i = 0; i < inputs.tokens.length; i++) {
            // Pay 0.1% fee on ERC20 deposit to DeFi Basket
            defibasketFee = inputs.amounts[i] / 1000;
            IERC20(inputs.tokens[i]).safeTransferFrom(ownerOf(nftId), defibasketContractOwner, defibasketFee);

            // Transfer 99.9% of ERC20 token to Wallet
            IERC20(inputs.tokens[i]).safeTransferFrom(ownerOf(nftId), walletAddress, inputs.amounts[i] - defibasketFee);
        }
    }

    /**
      * @notice This is how DeFi Basket communicates with other protocols.
      *
      * @dev This is where the magic happens. Bridges interact with delegate calls to enable DeFi Basket to interact with
      * a wide and expanding variety of protocols.
      *
      * @param nftId NFT Id
      * @param _bridgeAddresses Addresses of deployed bridges that will be called
      * @param _bridgeEncodedCalls Encoded calls to be passed on to delegate calls
      */
    function _writeToWallet(
        uint256 nftId,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) internal {
        address walletAddress = walletOf(nftId);
        Wallet wallet = Wallet(payable(walletAddress));
        wallet.useBridges(_bridgeAddresses, _bridgeEncodedCalls);
    }

    /**
      * @notice Transfer ETH and ERC20 tokens back to the owner of the corresponding NFT.
      *
      * @param nftId NFT Id
      * @param outputs ERC20 token addresses and percentages that will exit the Wallet and go to NFT owner
      * @param outputEthPercentage ETH percentage that will exit the Wallet and go to NFT owner
      */
    function _withdrawFromWallet(
        uint256 nftId,
        DBDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage
    ) internal {
        uint256[] memory outputAmounts;
        uint256 outputEth;

        Wallet wallet = Wallet(payable(walletOf(nftId)));
        (outputAmounts, outputEth) = wallet.withdraw(outputs, outputEthPercentage, ownerOf(nftId));

        emit DEFIBASKET_WITHDRAW(outputAmounts, outputEth);
    }

    // Art related
    /**
     * @dev Internal function to set the base URI for all token IDs. It is
     * automatically added as a prefix to the value returned in {tokenURI},
     * or to the token ID if {tokenURI} is empty.
     */
    function setBaseURI(string memory nftImageURI) external onlyOwner {
        _nftImageURI = nftImageURI;
    }

    /**
     * @notice Returns the base URI for the NFT metadata
     *
     * @dev The URI of a specific token will be the base URI concatenated with the token id, e.g. for token 0
     * the URI will be http://placeholder.com/0.
     */
    function _baseURI() internal view override returns (string memory) {
        return _nftImageURI;
    }    
}
