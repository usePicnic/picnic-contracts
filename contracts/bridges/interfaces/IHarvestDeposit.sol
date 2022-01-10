// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IHarvestDeposit {
    event DEFIBASKET_HARVEST_DEPOSIT(
        uint256 amountIn
    );

    event DEFIBASKET_HARVEST_WITHDRAW(
        uint256 fAssetAmountOut,
        uint256 assetAmountOut,
        address[] rewardTokens,
        uint256[] rewardBalancesOut
    );

    event DEFIBASKET_HARVEST_CLAIM(
        address[] rewardTokens,
        uint256[] rewardBalancesOut
    );

    function deposit(address vaultAddress, address poolAddress, uint256 percentageIn) external;
    function withdraw(address vaultAddress, address poolAddress, uint256 percentageOut) external;
    function claimRewards(address poolAddress) external;
}


