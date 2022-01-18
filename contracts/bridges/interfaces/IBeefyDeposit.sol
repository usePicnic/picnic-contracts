// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IBeefyDeposit {
    event DEFIBASKET_BEEFY_DEPOSIT(
        uint256 amountIn,
        uint256 mooTokenReceived
    );

    event DEFIBASKET_BEEFY_WITHDRAW(
        uint256 burnAmount,
        address assetReceived,
        uint256 amountReceived
    );

    function deposit(address vaultAddress, uint256 percentageIn) external;
    function withdraw(address vaultAddress, uint256 percentageOut) external;

}


