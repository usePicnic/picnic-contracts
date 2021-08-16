pragma solidity ^0.8.6;

import "./Wallet.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract IndexPool is ERC721, Ownable {
    event LOG_PORTFOLIO_REGISTERED(
        address creator,
        uint256 portfolioId,
        string jsonString
    );
    event LOG_MINT_NFT(
        uint256 nftId,
        address wallet,
        address owner,
        address finder,
        address creator,
        address[] inputTokens,
        uint256[] inputAmounts,
        uint256 ethAmount
    );
    event LOG_EDIT_NFT(
        uint256 nftId,
        address wallet,
        address owner,
        address finder,
        address creator,
        address[] inputTokens,
        uint256[] inputAmounts,
        uint256 ethAmount
    );

    modifier _indexpoolOnly_() {
        require(
            indexpoolOwner == msg.sender,
            "ONLY INDEXPOOL CAN CALL THIS FUNCTION"
        );
        _;
    }

    modifier _maxDeposit_() {
        require(
            msg.value <= maxDeposit,
            "DEPOSIT ABOVE MAXIMUM AMOUNT (GUARDED LAUNCH)"
        );
        _;
    }

    // Constants
    uint256 private constant BASE_ASSET = 1000000000000000000;

    // Contract properties
    address indexpoolOwner;
    uint256 public maxDeposit = 100 * BASE_ASSET;

    // Portfolios
    uint256 private portfolioCounter = 0;
    mapping(uint256 => address) private _portfolioIdToCreator;

    // NFT properties
    uint256 public tokenCounter = 0;
    mapping(uint256 => address) private _nftIdToWallet;

    constructor() public ERC721("INDEXPOOL", "IPNFT") {
        indexpoolOwner = msg.sender;
    }

    // Guarded launch
    function setMaxDeposit(uint256 newMaxDeposit)
    external
    _indexpoolOnly_
    {
        maxDeposit = newMaxDeposit;
    }

    function registerPortfolio(string calldata jsonString) external {
        uint256 portfolioId = uint256(keccak256(abi.encodePacked(msg.sender, portfolioCounter, block.timestamp)));
        emit LOG_PORTFOLIO_REGISTERED(msg.sender, portfolioId, jsonString);
        portfolioCounter++;
    }

    function mintPortfolio(
        address finder,
        address creator,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external payable _maxDeposit_ {
        // Create new wallet
        Wallet wallet = new Wallet();

        // Run all bridges and calls to build the portfolio on Wallet
        _delegateToWallet(msg.value, msg.sender, inputTokens, inputAmounts, wallet, _bridgeAddresses, _bridgeEncodedCalls);

        // Mint NFT
        uint256 nftId = _mintNFT({walletAddress : address(wallet), owner : msg.sender});

        emit LOG_MINT_NFT(
            nftId,
            address(wallet),
            msg.sender,
            finder,
            creator,
            inputTokens,
            inputAmounts,
            msg.value);
    }

    function editPortfolio(
        uint256 nftId,
        address finder,
        address creator,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external payable _maxDeposit_ {
        // Instantiate existing wallet
        require(ownerOf(nftId) == msg.sender, "INDEXPOOL: ONLY NFT OWNER CAN EDIT IT");
        Wallet wallet = Wallet(payable(_nftIdToWallet[nftId]));

        // Run all bridges and calls to build the portfolio on Wallet
        _delegateToWallet(msg.value, msg.sender, inputTokens, inputAmounts, wallet, _bridgeAddresses, _bridgeEncodedCalls);

        emit LOG_EDIT_NFT(
            nftId,
            address(wallet),
            msg.sender,
            finder,
            creator,
            inputTokens,
            inputAmounts,
            msg.value);
    }

    function _transferTokens(
        address from,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address toWallet
    ) private {
        for (uint16 i = 0; i < inputTokens.length; i++) {
            // IndexPool Fee
            uint256 indexpoolFee = inputAmounts[i] / 1000;
            IERC20(inputTokens[i]).transferFrom(from, indexpoolOwner, indexpoolFee);

            // Transfer ERC20 to Wallet
            IERC20(inputTokens[i]).transferFrom(from, toWallet, inputAmounts[i] - indexpoolFee);
        }
    }

    function _delegateToWallet(
        uint256 ethAmount,
        address user,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        Wallet wallet,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls)
    internal {
        // Transfer ERC20 tokens to Wallet
        _transferTokens(user, inputTokens, inputAmounts, address(wallet));

        // Pay fee to IndexPool
        uint256 indexpoolFee = ethAmount / 1000;
        payable(indexpoolOwner).transfer(indexpoolFee);

        // Execute functions calls + transfer ETH to wallet
        wallet.write{value : ethAmount - indexpoolFee}(_bridgeAddresses, _bridgeEncodedCalls);
    }

    function _mintNFT(address walletAddress, address owner) internal returns (uint256) {
        // Saving NFT data
        uint256 newItemId = tokenCounter;
        _nftIdToWallet[newItemId] = walletAddress;
        tokenCounter = tokenCounter + 1;

        // Minting NFT
        _safeMint(indexpoolOwner, newItemId);
        return newItemId;
    }

    // TODO we might need to implement a public walletOf method.
    //
    //    function walletOf(uint256 nftId) external view returns (address) {
    //        return _nftIdToWallet[nftId];
    //    }
    //
    // TODO we might need to be able to transfer ownership to a DAO
    //    function transferOwnership(address newOwner) external _indexpoolOnly_ {
    //        owner = newOwner;
    //    }
}

