pragma solidity ^0.8.6;

interface IStake {

    event Deposit (
        address assetIn,
        uint256 amountIn
    );

    event Harvest (
        address claimedAsset,
        uint256 claimedReward
    );

    event Withdraw (
        address assetOut,
        uint256 amountOut
    );

    function deposit(address assetIn, uint256 percentageIn) external;

    function harvest(address asset) external;

    function withdraw(address assetOut, uint256 percentageOut) external;
}


