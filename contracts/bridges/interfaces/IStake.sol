pragma solidity ^0.8.6;

interface IStake {

    event IndexPool_Stake_Deposit (
        address assetIn,
        uint256 amountIn
    );

    event IndexPool_Stake_Withdraw (
        address assetOut,
        uint256 amountOut
    );

    event IndexPool_Stake_Harvest (
        address claimedAsset,
        uint256 claimedReward
    );

    function deposit(address assetIn, uint256 percentageIn) external;

    function harvest(address asset) external;

    function withdraw(address assetOut, uint256 percentageOut) external;
}


