pragma solidity ^0.8.6;

interface ISwap {
    event TradedFromETHToToken(
        address[] path,
        uint256[] amounts
    );

    event TradedFromTokenToETH(
        address[] path,
        uint256[] amounts
    );

    event TradedFromTokenToToken(
        address[] path,
        uint256[] amounts
    );

    function deposit(address assetIn, uint256 percentageIn) external;

    function harvest(address asset) external;

    function withdraw(address assetOut, uint256 percentageOut) external;
}


