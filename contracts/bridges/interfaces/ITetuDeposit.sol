// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ITetuDeposit {
    event DEFIBASKET_TETU_DEPOSIT(
        uint256 amountIn
    );

    event DEFIBASKET_TETU_WITHDRAW(
        uint256 xTokenAmountOut,
        uint256 assetAmountOut,
        address[] rewardTokens,
        uint256[] rewardBalancesOut
    );

    event DEFIBASKET_TETU_CLAIM_REWARDS(
        address[] rewardTokens,
        uint256[] rewardBalancesOut
    );

    function deposit(address poolAddress, uint256 percentageIn) external;
    function withdraw(address poolAddress, uint256 percentageOut) external;
    function claimRewards(address poolAddress) external;
}


