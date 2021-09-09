pragma solidity ^0.8.6;

interface ISwap {
    event TradedFromTokenToToken(
        address[] path,
        uint256[] amounts
    );

    function swapTokenToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) external;
}


