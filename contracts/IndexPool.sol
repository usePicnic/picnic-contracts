pragma solidity ^0.8.6;

import "./Wallet.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IIndexPool.sol";

// TODO we are missing the finderAddress to calculate incentives
// TODO we are missing the portfolioId to calculate marketCap

contract IndexPool is ERC721, Ownable {
    struct TokenData {
        address[] tokens;
        uint256[] amounts;
    }

    event INDEXPOOL_PORTFOLIO_REGISTERED(
        address creator,
        uint256 portfolioId,
        string jsonString
    );

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
    uint256 public fee = 10;

    // Portfolios
    uint256 private portfolioCounter = 0; // TODO review if/why is this necessary?
    mapping(uint256 => address) private _portfolioIdToCreator; // TODO review if/why is this necessary?

    // NFT properties
    uint256 public tokenCounter = 0;
    mapping(uint256 => address) private _nftIdToWallet;

    constructor() public ERC721("INDEXPOOL", "IPNFT") Ownable() {}

    // Guarded launch
    function setMaxDeposit(uint256 newMaxDeposit)
    external
    onlyOwner
    {
        maxDeposit = newMaxDeposit;
    }

    function setFee(uint256 newFee)
    external
    onlyOwner
    {
        require(newFee <= 100, "INDEXPOOL: MAX FEE IS 1%");
        fee = newFee;
    }

    function walletOf(uint256 nftId) public view returns (address) {
        return _nftIdToWallet[nftId];
    }

    function registerPortfolio(string calldata jsonString) external  {
        uint256 portfolioId = uint256(keccak256(abi.encodePacked(msg.sender, portfolioCounter, block.timestamp)));
        emit INDEXPOOL_PORTFOLIO_REGISTERED(msg.sender, portfolioId, jsonString);
        portfolioCounter++;
    }

    // TODO make requires check length input/output tokens and amounts
    // TODO Check min amounts

    function createPortfolio(
        TokenData calldata inputs,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external _maxDeposit_ {
        uint256 nftId = _mintNFT(msg.sender);
        editPortfolio(
            nftId,
            inputs,
            _bridgeAddresses,
            _bridgeEncodedCalls
            );
    }

    function editPortfolio(
        uint256 nftId,
        TokenData calldata inputs,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable public _onlyNFTOwner_(nftId) _maxDeposit_ {
        address walletAddress = walletOf(nftId);
        _depositToWallet(msg.sender, inputs, msg.value, nftId);

        Wallet wallet = Wallet(payable(walletAddress));
        wallet.write(_bridgeAddresses, _bridgeEncodedCalls);
    }

    function editAndWithdrawPortfolio(
        uint256 nftId,
        TokenData calldata inputs,
        TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external _onlyNFTOwner_(nftId) {
        editPortfolio(
            nftId,
            inputs,
            _bridgeAddresses,
            _bridgeEncodedCalls
        );
        _withdrawFromWallet(nftId, outputs, outputEthPercentage);
    }

    function withdrawPortfolio(
        uint256 nftId,
        TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external _onlyNFTOwner_(nftId) {
        address walletAddress = walletOf(nftId);
        Wallet wallet = Wallet(payable(walletAddress));
        wallet.write(_bridgeAddresses, _bridgeEncodedCalls);

        _withdrawFromWallet(nftId, outputs, outputEthPercentage);
    }

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
        TokenData calldata inputs,
        uint256 ethAmount,
        uint256 nftId
    ) internal {
        // Pay fee to IndexPool
        uint256 indexpoolFee = fee * ethAmount / 10000;
        address walletAddress = walletOf(nftId);
        payable(owner()).transfer(indexpoolFee);
        payable(walletAddress).transfer(ethAmount - indexpoolFee);

        for (uint16 i = 0; i < inputs.tokens.length; i++) {
            // IndexPool Fee
            indexpoolFee = fee * inputs.amounts[i] / 10000;

            IERC20(inputs.tokens[i]).transferFrom(from, owner(), indexpoolFee); // owner = contract owner (Ownable)
            IERC20(inputs.tokens[i]).transferFrom(from, walletAddress, inputs.amounts[i] - indexpoolFee);
        }
        emit INDEXPOOL_DEPOSIT(nftId, inputs.tokens, inputs.amounts, ethAmount);
    }

    function _withdrawFromWallet(
        uint256 nftId,
        TokenData calldata outputs,
        uint256 outputEthPercentage
    ) internal {
        uint256[] memory outputAmounts;
        uint256 outputEth;

        Wallet wallet = Wallet(payable(walletOf(nftId)));
        (outputAmounts, outputEth) = wallet.withdraw(outputs.tokens, outputs.amounts, outputEthPercentage, ownerOf(nftId));

        emit INDEXPOOL_WITHDRAW(nftId, outputs.tokens, outputAmounts, outputEth);
    }
}
