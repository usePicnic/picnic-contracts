pragma solidity ^0.8.6;

interface ISwap {
    event INDEXPOOL_SWAP_TOKEN(
        address[] path,
        uint256[] amounts
    );

    function swapTokenToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) external;
}
