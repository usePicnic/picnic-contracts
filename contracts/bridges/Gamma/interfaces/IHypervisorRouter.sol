// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IHypervisorRouter {
  function deposit(
    uint256 deposit0,
    uint256 deposit1,
    address to,
    address pos,
    uint256[4] memory minIn
  ) external returns (uint256 shares);
}