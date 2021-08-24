pragma solidity ^0.8.6;

import "./Wallet.sol";
import "./interfaces/IIndexPool.sol";
import "./libraries/IPDataTypes.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IndexPool
 * @author IndexPool
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
 * 3. Collect fees for the IndexPool protocol
 */

contract IndexPool is IIndexPool, ERC721, Ownable {

    // Events
    event INDEXPOOL_MINT_NFT(
        uint256 nftId,
        address wallet,
        address nftOwner
    );

    event INDEXPOOL_DEPOSIT(
        uint256 nftId,
        address[] inputTokens,
        uint256[] inputAmounts,
        uint256 ethAmount
    );

    event INDEXPOOL_WITHDRAW(
        uint256 nftId,
        address[] outputTokens,
        uint256[] outputAmounts,
        uint256 ethAmount
    );

    modifier _onlyNFTOwner_(uint256 nftId) {
        require(
            msg.sender == ownerOf(nftId),
            "INDEXPOOL: ONLY NFT OWNER CAN CALL THIS FUNCTION"
        );
        _;
    }

    // Constants
    uint256 private constant BASE_ASSET = 1000000000000000000;

    // NFT properties
    uint256 public tokenCounter = 0;
    mapping(uint256 => address) private _nftIdToWallet;

    // Constructor
    constructor() ERC721("INDEXPOOL", "IPNFT") Ownable() {}

    // External functions

    /**
     * @notice Returns wallet address of a given NFT id.
     *
     * @dev Each NFT id has its own Wallet, which is a contract that holds funds separately from other users funds.
     *
     * @param nftId NFT Id
     */
    function walletOf(uint256 nftId) public view returns (address)  {
        return _nftIdToWallet[nftId];
    }

    // TODO make requires check length input/output tokens and amounts
    // TODO Check min amounts

    // TODO what is a bridge?
    // TODO make diagram
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
     * @param _bridgeAddresses Addresses of deployed bridges that will be called
     * @param _bridgeEncodedCalls Encoded calls to be passed on to delegate calls
     */
    function createPortfolio(
        IPDataTypes.TokenData calldata inputs,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external override {
        uint256 nftId = _mintNFT(msg.sender);
        _depositToWallet(nftId, inputs, msg.value);
        _writeToWallet(nftId, _bridgeAddresses, _bridgeEncodedCalls);
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
     * @param _bridgeAddresses Addresses of deployed bridges that will be called
     * @param _bridgeEncodedCalls Encoded calls to be passed on to delegate calls
     */
    function depositPortfolio(
        uint256 nftId,
        IPDataTypes.TokenData calldata inputs,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external _onlyNFTOwner_(nftId) override {
        _depositToWallet(nftId, inputs, msg.value);
        _writeToWallet(nftId, _bridgeAddresses, _bridgeEncodedCalls);
    }

    // TODO is this really necessary?
    /**
     * @notice Deposit more funds into an existing portfolio.
     *
     * @dev The depositAndWithdraw function is composed of 3 steps:
     *
     * 1. Transfer resources (ETH and ERC20 tokens) to Wallet.
     * 2. Process bridge calls (interact with Uniswap/Aave...).
     * 3. Transfer resources (ETH and ERC20 tokens) to NFT owner.
     *
     * @param nftId NFT Id
     * @param inputs ERC20 token addresses and amounts that will enter the contract
     * @param outputs ERC20 token addresses and percentages that will exit the contract
     * @param outputEthPercentage percentage of ETH in wallet that will exit the contract
     * @param _bridgeAddresses Addresses of deployed bridges that will be called
     * @param _bridgeEncodedCalls Encoded calls to be passed on to delegate calls
     */
    function depositAndWithdrawPortfolio(
        uint256 nftId,
        IPDataTypes.TokenData calldata inputs,
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external _onlyNFTOwner_(nftId) override {
        _depositToWallet(nftId, inputs, msg.value);
        _writeToWallet(nftId, _bridgeAddresses, _bridgeEncodedCalls);
        _withdrawFromWallet(nftId, outputs, outputEthPercentage);
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
     * @param outputEthPercentage percentage of ETH in wallet that will exit the contract
     * @param _bridgeAddresses Addresses of deployed bridges that will be called
     * @param _bridgeEncodedCalls Encoded calls to be passed on to delegate calls
     */
    function withdrawPortfolio(
        uint256 nftId,
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external _onlyNFTOwner_(nftId) override {
        _writeToWallet(nftId, _bridgeAddresses, _bridgeEncodedCalls);
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
        // Create new wallet
        Wallet wallet = new Wallet();

        // Save NFT data
        uint256 nftId = tokenCounter;
        _nftIdToWallet[nftId] = address(wallet);
        tokenCounter = tokenCounter + 1;

        // Mint NFT
        _safeMint(nftOwner, nftId);

        emit INDEXPOOL_MINT_NFT(
            nftId,
            address(wallet),
            msg.sender);

        return nftId;
    }

    /**
      * @notice Transfer deposited ETH and ERC20 tokens to the Wallet linked to the referenced NFT.
      *
      * @dev Transfer assets to the corresponding Wallet going through the following steps:
      * 1. Transfer deposited ETH into the IndexPool contract to the Wallet contract.
      * 2. Transfer approved ERC20 tokens from the user account to the Wallet contract.
      * 3. Charge 0.1% fee for IndexPool
      *
      * @param nftId NFT Id
      * @param inputs ERC20 token addresses and amounts that entered the contract and will go to Wallet
      * @param ethAmount ETH amount that entered the contract and will go to Wallet
      */
    function _depositToWallet(
        uint256 nftId,
        IPDataTypes.TokenData calldata inputs,
        uint256 ethAmount
    ) internal {
        // Pay fee to IndexPool
        uint256 indexpoolFee = ethAmount / 1000;
        // 0.1% fee on deposits
        address walletAddress = walletOf(nftId);
        address indexpoolAddress = owner();
        // owner() = contract owner = IndexPool (Ownable)

        payable(indexpoolAddress).transfer(indexpoolFee);
        payable(walletAddress).transfer(ethAmount - indexpoolFee);

        for (uint16 i = 0; i < inputs.tokens.length; i++) {
            // IndexPool Fee
            indexpoolFee = inputs.amounts[i] / 1000;
            // 0.1% fee on deposits

            IERC20(inputs.tokens[i]).transferFrom(ownerOf(nftId), indexpoolAddress, indexpoolFee);
            IERC20(inputs.tokens[i]).transferFrom(ownerOf(nftId), walletAddress, inputs.amounts[i] - indexpoolFee);
        }
        emit INDEXPOOL_DEPOSIT(nftId, inputs.tokens, inputs.amounts, ethAmount);
    }

    /**
      * @notice This is how IndexPool communicates with other protocols.
      *
      * @dev This is where the magic happens. Bridges interact with delegate calls to enable IndexPool to interact with
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
        wallet.write(_bridgeAddresses, _bridgeEncodedCalls);
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
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage
    ) internal {
        uint256[] memory outputAmounts;
        uint256 outputEth;

        Wallet wallet = Wallet(payable(walletOf(nftId)));
        (outputAmounts, outputEth) = wallet.withdraw(outputs, outputEthPercentage, ownerOf(nftId));

        emit INDEXPOOL_WITHDRAW(nftId, outputs.tokens, outputAmounts, outputEth);
    }
}
