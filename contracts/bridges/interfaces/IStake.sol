pragma solidity ^0.8.6;

interface IStake {

    event INDEXPOOL_STAKE_IN (
        address assetIn,
        uint256 amountIn
    );

    event INDEXPOOL_STAKE_OUT (
        address assetOut,
        uint256 amountOut
    );

    function deposit(address assetIn, uint256 percentageIn) external;

    function withdraw(address assetOut, uint256 percentageOut) external;
}


