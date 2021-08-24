pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../libraries/IPDataTypes.sol";

pragma experimental ABIEncoderV2; // TODO is this necessary?

interface IIndexPool is IERC721 { // TODO should we add interface for ownable?
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

    function depositAndWithdrawPortfolio(
        uint256 nftId,
        IPDataTypes.TokenData calldata inputs,
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) payable external;

    function withdrawPortfolio(
        uint256 nftId,
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external;
}


