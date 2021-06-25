pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Pool721 is ERC721, Ownable {
    uint256 public tokenCounter;
    address creator;
    mapping(uint256 => address[]) public tokenIdToTokenAdresses;
    mapping(uint256 => uint256[]) public tokenIdToAllocation;
    mapping(uint256 => uint256) public tokenIdToIndexId;

    constructor() public ERC721("Dogie", "DOG") {
        tokenCounter = 0;
        creator = msg.sender;
    }
    
    modifier _indexpool_only_() {
        require(msg.sender == creator, "ONLY INDEXPOOL CAN CALL THIS FUNCTION");
        _;
    }

    function generatePool721(
        address user,
        uint256 indexId,
        uint256[] memory allocation
    ) external _indexpool_only_ returns (uint256) {
        uint256 newItemId = tokenCounter;

        _safeMint(user, newItemId);

        tokenIdToIndexId[newItemId] = indexId;
        tokenIdToAllocation[newItemId] = allocation;

        tokenCounter = tokenCounter + 1;

        return newItemId;
    }

    function burnPool721(
        uint256 tokenId
    ) external _indexpool_only_ returns (uint256, uint256[] memory) {
        uint256 index_id = tokenIdToIndexId[tokenId];
        uint256[] memory allocation = tokenIdToAllocation[tokenId];

        _burn(tokenId);

        return (index_id, allocation);
    }

    function viewPool721(
        uint256 tokenId
    ) external view returns (uint256, uint256[] memory) {
        uint256 index_id = tokenIdToIndexId[tokenId];
        uint256[] memory allocation = tokenIdToAllocation[tokenId];

        return (index_id, allocation);
    }
}
