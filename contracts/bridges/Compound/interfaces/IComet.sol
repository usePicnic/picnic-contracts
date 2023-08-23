// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IComet {
    function supply(address asset, uint amount) external override;

    function withdraw(address asset, uint amount) external override;
}
