// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../libraries/DBDataTypes.sol";

interface IDeFiBasket is IERC721 {
    // Events
    event DEFIBASKET_CREATE(
        uint256 nftId,
        address wallet
    );

    event DEFIBASKET_DEPOSIT();

    event DEFIBASKET_EDIT();

    event DEFIBASKET_WITHDRAW(
        uint256[] outputAmounts,
        uint256 ethAmount
    );

    function createPortfolio(
        DBDataTypes.TokenData calldata inputs,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external;

    function depositPortfolio(
        uint256 nftId,
        DBDataTypes.TokenData calldata inputs,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external;

    function editPortfolio(
        uint256 nftId,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external;

    function withdrawPortfolio(
        uint256 nftId,
        DBDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external;
}


