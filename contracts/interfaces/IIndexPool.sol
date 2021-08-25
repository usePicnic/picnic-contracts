pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../libraries/IPDataTypes.sol";

interface IIndexPool is IERC721 {
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


