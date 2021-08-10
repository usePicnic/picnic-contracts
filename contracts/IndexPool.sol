pragma solidity ^0.8.6;

import "./Wallet.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract IndexPool is ERC721, Ownable {
    event LOG_PORTFOLIO_REGISTERED();
    event LOG_MINT_NFT(
        uint256 nftId,
        address owner,
        address finder,
        address creator,
        address[] inputTokens,
        uint256[] inputAmounts,
        uint256 ethAmount
    );
    event LOG_EDIT_NFT(
        uint256 nftId,
        address owner,
        address finder,
        address creator,
        address[] inputTokens,
        uint256[] inputAmounts,
        uint256 ethAmount
    );

    modifier _indexpoolOnly_() {
        require(
            indexpoolAddress == msg.sender,
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
    address indexpoolAddress;
    uint256 public maxDeposit = 100 * BASE_ASSET;

    // NFT properties
    uint256 public tokenCounter = 0;
    mapping(uint256 => address) public nftIdToWallet;

    constructor() public ERC721("INDEXPOOL", "IPNFT") {
        indexpoolAddress = msg.sender;
    }

    // Guarded launch
    function setMaxDeposit(uint256 newMaxDeposit)
    external
    _indexpoolOnly_
    {
        maxDeposit = newMaxDeposit;
    }

    function registerPortfolio(
        address[][] calldata _bridgeAddresses,
        bytes[][] calldata _bridgeEncodedCalls
    ) external {
        for (uint16 i = 0; i < _bridgeAddresses.length; i++) {
            // TODO log events with index creation -- bridges / data / creator
        }
    }

    function mintPortfolio(
        address finder,
        address creator,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external payable _maxDeposit_ {
        Wallet wallet = new Wallet();
        _delegateToWallet(msg.sender, inputTokens, inputAmounts, address(wallet));
        _mintNFT({walletAddress : address(wallet), owner : msg.sender});
        // emit LOG_MINT_NFT();
    }

    function editPortfolio(
        uint256 nftId,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external payable _maxDeposit_ {
        require(_owners[nftId] == msg.sender, "Only NFT owner can edit it");
        Wallet wallet = Wallet(payable(nftIdToWallet[nftId]));
        _delegateToWallet(msg.sender, inputTokens, inputAmounts, wallet);
        // emit LOG_EDIT_NFT();
    }

    function _transferTokens(
        address from,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address toWallet
    ) private {
        // TODO fee for Portfolio Creators / Finder?
        for (uint16 i = 0; i < inputTokens.length; i++) {
            uint256 indexpoolFee = inputAmounts[i] / 1000;
            IERC20(inputTokens[i]).transferFrom(from, indexpoolAddress, indexpoolFee);
            IERC20(inputTokens[i]).transferFrom(from, toWallet, inputAmounts[i] - indexpoolFee);
        }
    }

    function _delegateToWallet(
        address user,
        address[] inputTokens,
        address[] inputAmounts,
        Wallet wallet)
    internal payable {
        // Transfer ERC20 tokens to Wallet
        _transferTokens(user, inputTokens, inputAmounts, address(wallet));

        // Pay fee to IndexPool
        uint256 indexpoolFee = msg.value / 1000;
        payable(indexpoolAddress).transfer(indexpoolFee);

        // Execute functions calls + transfer ETH to wallet
        wallet.write{value : msg.value - indexpoolFee}(_bridgeAddresses, _bridgeEncodedCalls);
    }

    function _mintNFT(address walletAddress, address owner) internal {
        uint256 newItemId = tokenCounter;
        nftIdToWallet[newItemId] = walletAddress;
        tokenCounter = tokenCounter + 1;
        _safeMint(owner, newItemId);
    }


}

