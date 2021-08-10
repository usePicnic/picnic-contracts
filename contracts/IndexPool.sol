pragma solidity ^0.8.6;

import "./Wallet.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract IndexPool is ERC721, Ownable {
    event LOG_MINT_NFT();
    event LOG_EDIT_NFT();


    modifier _indexpoolOnly_() {
        require(
            creator == msg.sender,
            "ONLY WALLET OWNER CAN CALL THIS FUNCTION"
        );
        _;
    }

    // TODO is Index necessary?
    struct Index {
        address creator;
    }

    uint256 private constant BASE_ASSET = 1000000000000000000;
    uint256 public maxDeposit = 100 * BASE_ASSET;

    Index[] private _indexes;
    uint256 public tokenCounter = 0;

    address creator;

    mapping(uint256 => address) public nftIdToWallet;
    constructor() public ERC721("INDEXPOOL", "IPNFT") {
        creator = msg.sender;
    }

    event Received(address sender, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

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

    function _transferTokens(
        address from,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address toWallet
    ) private {
        // TODO fee for Portfolio Creators / Finder?
        for (uint16 i = 0; i < inputTokens.length; i++) {
            uint256 indexpoolFee = inputAmounts[i] / 1000;
            IERC20(inputTokens[i]).transferFrom(from, creator, indexpoolFee);
            IERC20(inputTokens[i]).transferFrom(from, toWallet, inputAmounts[i] - indexpoolFee);
        }
    }

    function mintPortfolio(
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external payable {
        Wallet wallet = new Wallet();

        _transferTokens(msg.sender, inputTokens, inputAmounts, address(wallet)); // TODO understand if there is a better

        uint256 indexpoolFee = msg.value / 1000;
        payable(creator).transfer(indexpoolFee);
        // payable(wallet).transfer(msg.value - indexpoolFee);

        wallet.write{value:msg.value - indexpoolFee}(_bridgeAddresses, _bridgeEncodedCalls);

        uint256 newItemId = tokenCounter;
        // nftIdToIndexId[newItemId] = indexId;
        nftIdToWallet[newItemId] = address(wallet);
        tokenCounter = tokenCounter + 1;
        _safeMint(msg.sender, newItemId);

        emit LOG_MINT_NFT();
    }

    function editPortfolio(
        uint256 nftId,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external payable {
        Wallet wallet = Wallet(payable(nftIdToWallet[nftId]));

        _transferTokens(msg.sender, inputTokens, inputAmounts, address(wallet)); // TODO understand if there is a better

        uint256 indexpoolFee = msg.value / 1000;
        payable(creator).transfer(indexpoolFee);
        payable(wallet).transfer(msg.value - indexpoolFee);

        wallet.write(_bridgeAddresses, _bridgeEncodedCalls);

        emit LOG_EDIT_NFT();
    }
}

