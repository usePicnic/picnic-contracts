pragma solidity 0.8.6;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IIndexPoolNFT is IERC721 {
    function generatePool721(
        address user,
        uint256[] memory allocation
    ) external returns (uint256);

    function burnPool721(
        uint256 tokenId
    ) external  returns (uint256[] memory);

    function viewPool721(
        uint256 tokenId
    ) external view returns (uint256[] memory);
}
