pragma solidity ^0.8.6;

interface IAaveV2Deposit {
    event INDEXPOOL_AAVEV2_DEPOSIT (
        address assetIn,
        address assetOut,
        uint256 amount
    );

    event INDEXPOOL_AAVEV2_WITHDRAW (
        address assetIn,
        address assetOut,
        uint256 amount,
        address rewardAsset,
        uint256 rewardAmount
    );

    function deposit(address assetIn, uint256 percentageIn) external;

    function withdraw(address assetOut, uint256 percentageOut) external;
}


