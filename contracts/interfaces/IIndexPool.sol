// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../libraries/IPDataTypes.sol";

interface IIndexPool is IERC721 {
    // Events
    event INDEXPOOL_CREATE(
        uint256 nftId,
        address wallet
    );

    event INDEXPOOL_DEPOSIT();

    event INDEXPOOL_EDIT();

    event INDEXPOOL_WITHDRAW(
        uint256[] outputAmounts,
        uint256 ethAmount
    );

    function createPortfolio(
        IPDataTypes.TokenData calldata inputs,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external;

    function depositPortfolio(
        uint256 nftId,
        IPDataTypes.TokenData calldata inputs,
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
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external;
}


