// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IAutofarmDeposit {
    event DEFIBASKET_AUTOFARM_DEPOSIT (
        address vaultAddress,
        address assetIn,
        uint256 amount
    );

    event DEFIBASKET_AUTOFARM_WITHDRAW (
        address vaultAddress,
        address assetOut,
        uint256 amount,
        uint256 wMaticReward,
        uint256 pAutoReward
    );

    function deposit(uint256 percentageIn, uint256 poolId) external;

    function withdraw(uint256 percentageOut, uint256 poolId) external;
}


