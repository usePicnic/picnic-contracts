pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IIndexPoolNFT.sol";


contract IndexPoolNFT is ERC721, Ownable {
    uint256 public tokenCounter;
    address creator;
    mapping(uint256 => uint256[]) public nftIdToAllocation;
    mapping(uint256 => uint256) public nftIdToIndexId;

    event LOG_MINT_NFT(
        address indexed userAddress,
        uint256 indexed nftId,
        uint256 indexed indexId,
        uint256[] allocation
    );

    event LOG_BURN_NFT(
        uint256 indexed nftId
    );


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

        nftIdToIndexId[newItemId] = indexId;
        nftIdToAllocation[newItemId] = allocation;
        tokenCounter = tokenCounter + 1;

        _safeMint(user, newItemId);
        emit LOG_MINT_NFT(user, newItemId, indexId, allocation);

        return newItemId;
    }

    function burnPool721(
        uint256 nftId
    ) external _indexpoolOnly_ returns (uint256, uint256[] memory) {
        uint256 indexId = nftIdToIndexId[nftId];
        uint256[] memory allocation = nftIdToAllocation[nftId];

        _burn(nftId);

        nftIdToAllocation[nftId] = new uint256[](allocation.length);

        emit LOG_BURN_NFT(nftId);

        return (indexId, allocation);
    }

    function viewPool721(
        uint256 nftId
    ) external view returns (uint256, uint256[] memory)  {
        uint256 indexId = nftIdToIndexId[nftId];
        uint256[] memory allocation = nftIdToAllocation[nftId];

        return (indexId, allocation);
    }
}
