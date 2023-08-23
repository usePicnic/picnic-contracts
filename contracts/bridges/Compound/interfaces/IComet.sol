// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IComet {
    function supply(address asset, uint amount) external;

    function withdraw(address asset, uint amount) external;

    function balanceOf(address account) external view returns (uint256);
}
