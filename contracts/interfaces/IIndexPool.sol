pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../libraries/IPDataTypes.sol";

interface IIndexPool is IERC721 {
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


