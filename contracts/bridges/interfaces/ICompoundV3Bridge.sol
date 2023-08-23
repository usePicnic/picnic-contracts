// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ICompoundV3Bridge {
    event DEFIBASKET_COMPOUND_SUPPLY(address asset, uint amount);

    event DEFIBASKET_COMPOUND_WITHDRAW(address asset, uint amount);

    function supply(address asset, uint amount) external override;

    function withdraw(address asset, uint amount) external override;
}
