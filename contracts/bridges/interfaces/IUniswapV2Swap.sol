pragma solidity ^0.8.6;

interface IUniswapV2Swap {
    event INDEXPOOL_SWAP_TOKEN(
        address[] path, // TODO is this path necessary? already on header
        uint256[] amounts
    );

    function swapTokenToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) external;
}
