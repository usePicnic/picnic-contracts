// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IAaveV2Deposit {
    event INDEXPOOL_AAVEV2_DEPOSIT (
        address assetOut,
        uint256 amount
    );

    event INDEXPOOL_AAVEV2_WITHDRAW (
        address assetIn,
        uint256 amount,
        address rewardAsset,
        uint256 rewardAmount
    );

    function deposit(address assetIn, uint256 percentageIn) external;

    function withdraw(address assetOut, uint256 percentageOut) external;
}


