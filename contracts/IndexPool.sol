pragma solidity ^0.8.6;

import "./Wallet.sol";
import "./interfaces/IIndexPool.sol";
import "./libraries/IPDataTypes.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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

    // Modifiers
    modifier _maxDeposit_() {
        require(
            msg.value <= maxDeposit,
            "INDEXPOOL: DEPOSIT ABOVE MAXIMUM AMOUNT (GUARDED LAUNCH)"
        );
        _;
    }

    modifier _onlyNFTOwner_(uint256 nftId) {
        require(
            msg.sender == ownerOf(nftId),
            "INDEXPOOL: ONLY NFT OWNER CAN CALL THIS FUNCTION"
        );
        _;
    }

    // Constants
    uint256 private constant BASE_ASSET = 1000000000000000000;

    // Contract properties
    uint256 public maxDeposit = 100 * BASE_ASSET;
    uint256 public fee = 100;

    // NFT properties
    uint256 public tokenCounter = 0;
    mapping(uint256 => address) private _nftIdToWallet;

    // Constructor
    constructor() ERC721("INDEXPOOL", "IPNFT") Ownable() {}

    // External functions
    function setMaxDeposit(uint256 newMaxDeposit)
    external
    onlyOwner
    override
    {
        maxDeposit = newMaxDeposit;
    }

    function setFee(uint256 newFee)
    external
    onlyOwner
    override
    {
        require(newFee <= 1000, "INDEXPOOL: MAX FEE IS 1%");
        fee = newFee;
    }

    function walletOf(uint256 nftId) public view returns (address)  {
        return _nftIdToWallet[nftId];
    }

    // TODO make requires check length input/output tokens and amounts
    // TODO Check min amounts

    function createPortfolio(
        IPDataTypes.TokenData calldata inputs,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external _maxDeposit_ override {
        uint256 nftId = _mintNFT(msg.sender);
        _depositToWallet(msg.sender, inputs, msg.value, nftId);
        _writeToWallet(nftId, _bridgeAddresses, _bridgeEncodedCalls);
    }

    function depositPortfolio(
        uint256 nftId,
        IPDataTypes.TokenData calldata inputs,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external _onlyNFTOwner_(nftId) _maxDeposit_ override {
        _depositToWallet(msg.sender, inputs, msg.value, nftId);
        _writeToWallet(nftId, _bridgeAddresses, _bridgeEncodedCalls);
    }

    function depositAndWithdrawPortfolio(
        uint256 nftId,
        IPDataTypes.TokenData calldata inputs,
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external _onlyNFTOwner_(nftId) _maxDeposit_ override {
        _depositToWallet(msg.sender, inputs, msg.value, nftId);
        _writeToWallet(nftId, _bridgeAddresses, _bridgeEncodedCalls);
        _withdrawFromWallet(nftId, outputs, outputEthPercentage);
    }

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
    function _mintNFT(address nftOwner) internal returns (uint256){
        // Create new wallet
        Wallet wallet = new Wallet();

        // Saving NFT data
        uint256 nftId = tokenCounter;
        _nftIdToWallet[nftId] = address(wallet);
        tokenCounter = tokenCounter + 1;

        // Minting NFT
        _safeMint(nftOwner, nftId);

        emit INDEXPOOL_MINT_NFT(
            nftId,
            address(wallet),
            msg.sender);

        return nftId;
    }

    function _depositToWallet(
        address from,
        IPDataTypes.TokenData calldata inputs,
        uint256 ethAmount,
        uint256 nftId
    ) internal {
        // Pay fee to IndexPool
        uint256 indexpoolFee = fee * ethAmount / 100000;
        address walletAddress = walletOf(nftId);
        payable(owner()).transfer(indexpoolFee);
        payable(walletAddress).transfer(ethAmount - indexpoolFee);

        for (uint16 i = 0; i < inputs.tokens.length; i++) {
            // IndexPool Fee
            indexpoolFee = fee * inputs.amounts[i] / 100000;

            IERC20(inputs.tokens[i]).transferFrom(from, owner(), indexpoolFee);
            // owner = contract owner (Ownable)
            IERC20(inputs.tokens[i]).transferFrom(from, walletAddress, inputs.amounts[i] - indexpoolFee);
        }
        emit INDEXPOOL_DEPOSIT(nftId, inputs.tokens, inputs.amounts, ethAmount);
    }

    function _writeToWallet(
        uint256 nftId,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) internal {
        address walletAddress = walletOf(nftId);
        Wallet wallet = Wallet(payable(walletAddress));
        wallet.write(_bridgeAddresses, _bridgeEncodedCalls);
    }

    function _withdrawFromWallet(
        uint256 nftId,
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage
    ) internal {
        uint256[] memory outputAmounts;
        uint256 outputEth;

        Wallet wallet = Wallet(payable(walletOf(nftId)));
        (outputAmounts, outputEth) = wallet.withdraw(outputs.tokens, outputs.amounts, outputEthPercentage, ownerOf(nftId));

        emit INDEXPOOL_WITHDRAW(nftId, outputs.tokens, outputAmounts, outputEth);
    }
}
