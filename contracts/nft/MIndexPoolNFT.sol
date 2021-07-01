pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IIndexPoolNFT.sol";


contract MIndexPoolNFT is ERC721, Ownable {
    uint256 public tokenCounter;
    address creator;
    mapping(uint256 => address[]) public tokenIdToTokenAddresses;
    mapping(uint256 => uint256[]) public tokenIdToAllocation;
    mapping(uint256 => uint256) public tokenIdToIndexId;

    constructor() public ERC721("INDEXPOOL", "IPNFT") {
        tokenCounter = 0;
        creator = msg.sender;
    }

    modifier _indexpoolOnly_() {
        require(msg.sender == creator, "ONLY INDEXPOOL CAN CALL THIS FUNCTION");
        _;
    }

    function generatePool721(
        address user,
        uint256 indexId,
        uint256[] memory allocation
    ) external _indexpoolOnly_ returns (uint256) {
        uint256 newItemId = tokenCounter;

        _safeMint(user, newItemId);

        tokenIdToIndexId[newItemId] = indexId;
        tokenIdToAllocation[newItemId] = allocation;

        tokenCounter = tokenCounter + 1;

        return newItemId;
    }

    function burnPool721(
        uint256 tokenId
    ) external _indexpoolOnly_ returns (uint256, uint256[] memory) {
        uint256 indexId = tokenIdToIndexId[tokenId];
        uint256[] memory allocation = tokenIdToAllocation[tokenId];

        _burn(tokenId);

        return (indexId, allocation);
    }

    function viewPool721(
        uint256 tokenId
    ) external view returns (uint256, uint256[] memory)  {
        uint256 indexId = tokenIdToIndexId[tokenId];
        uint256[] memory allocation = tokenIdToAllocation[tokenId];

        return (indexId, allocation);
    }
}
