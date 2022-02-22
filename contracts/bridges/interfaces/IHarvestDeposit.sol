// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IHarvestDeposit {
    event DEFIBASKET_HARVEST_DEPOSIT(
        address assetIn,
        uint256 amountIn,
        uint256 amountOut
    );

    event DEFIBASKET_HARVEST_WITHDRAW(
        address assetOut,
        uint256 assetAmountOut,
        uint256 assetAmountIn,
        address[] rewardTokens,
        uint256[] rewardBalancesOut
    );

    event DEFIBASKET_HARVEST_CLAIM(
        address[] rewardTokens,
        uint256[] rewardBalancesOut
    );

    function deposit(address poolAddress, uint256 percentageIn) external;
    function withdraw(address poolAddress, uint256 percentageOut) external;
    function claimRewards(address poolAddress) external;
}


