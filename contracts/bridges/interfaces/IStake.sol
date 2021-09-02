pragma solidity ^0.8.6;

interface IStake {
    event Deposit (
        address assetIn,
        uint256 amount,
        address assetOut
    );
    event Withdraw (
        address assetIn,
        uint256 amount,
        uint256 percentageOut,
        address assetOut
    );

    event Harvest (
        address claimedAsset,
        uint256 claimedReward
    );

    function deposit(address assetIn, uint256 percentageIn) external;

    function harvest(address asset) external;

    function withdraw(address assetOut, uint256 percentageOut) external;
}


