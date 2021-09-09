pragma solidity ^0.8.6;

interface IStake {

    event INDEXPOOL_STAKE_DEPOSIT (
        address assetIn,
        uint256 amountIn
    );

    event INDEXPOOL_STAKE_WITHDRAW (
        address assetOut,
        uint256 amountOut
    );

    event INDEXPOOL_STAKE_HARVEST (
        address claimedAsset,
        uint256 claimedReward
    );

    function deposit(address assetIn, uint256 percentageIn) external;

    function harvest(address asset) external;

    function withdraw(address assetOut, uint256 percentageOut) external;
}


