// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IWMatic {
    function deposit() external payable;
    function withdraw(uint wad) external;
}