pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

pragma experimental ABIEncoderV2; // TODO is this necessary?

interface IIndexPool is IERC721 { // TODO should we add interface for ownable?
    function setMaxDeposit(uint256 newMaxDeposit) external;
    function registerPortfolio(string calldata jsonString) external;
    function mintPortfolio(
        address finder,
        address creator,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external payable;
    function editPortfolio(
        uint256 nftId,
        address finder,
        address creator,
        address[] calldata inputTokens,
        uint256[] calldata inputAmounts,
        address[] calldata outputTokens,
        uint256[] calldata outputPercentages,
        uint256 outputEthPercentage,
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external payable;
}


