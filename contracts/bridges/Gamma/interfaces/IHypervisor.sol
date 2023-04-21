// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IHypervisor {
  function withdraw(
    uint256 shares,
    address to,
    address from,
    uint256[4] memory minAmounts
  ) external returns (uint256, uint256);

  function balanceOf(
    address account
  ) external view returns (uint256);  
}