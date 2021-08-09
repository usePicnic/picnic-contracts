pragma solidity ^0.4.0;

import "./Wallet.sol";


contract IndexPool {

    // TODO is Index necessary?
    struct Index {
        address creator;
    }

    uint256 private constant BASE_ASSET = 1000000000000000000;
    uint256 public maxDeposit = 100 * BASE_ASSET;

    address indexpoolWallet;

    Index[] private _indexes;
    constructor(address _indexpoolWallet) {
        creator = msg.sender;
        indexpoolWallet = _indexpoolWallet; // TODO is creator different than _indexpoolWallet ???
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

    function transferTokens(
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address toWallet
    ){
        // TODO fee for Portfolio Creators / Finder?
        for (uint16 i = 0; i < inputTokens.length; i++) {
            indexpoolFee = inputAmounts[i] / 1000;
            if (inputTokens[i] == address(0))
            {
                payable(indexpoolWallet).transfer(indexpoolFee);
                payable(toWallet).transfer(inputAmounts[i] - indexpoolFee);
            }
            else {
                IERC20(inputTokens[i]).transfer(indexpoolWallet, indexpoolFee);
                IERC20(inputTokens[i]).transfer(toWallet, inputAmounts[i] - indexpoolFee);
            }
        }
    }

    function mintPortfolio(
        uint256 portfolioId,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external {
        transferTokens(inputTokens, inputAmounts, address(wallet)); // TODO understand if there is a better

        Wallet wallet = new Wallet();
        wallet.write(_bridgeAddresses, _bridgeEncodedCalls);

        uint256 newItemId = tokenCounter;
        nftIdToIndexId[newItemId] = indexId;
        nftIdToWallet[newItemId] = address(wallet);
        tokenCounter = tokenCounter + 1;
        _safeMint(user, newItemId);
        emit LOG_MINT_NFT();
    }

    function editPortfolio(
        uint256 nftId,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external {
        transferTokens(inputTokens, inputAmounts, address(wallet)); // TODO understand if there is a better

        Wallet wallet = Wallet(nftIdToWallet[nftId]);
        wallet.write(_bridgeAddresses, _bridgeEncodedCalls);

        emit LOG_EDIT_NFT();
    }
}

