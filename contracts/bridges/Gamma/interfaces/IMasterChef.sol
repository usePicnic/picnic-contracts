// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IMasterChef {
  function deposit(uint256 pid, uint256 amount, address to) external;
  function withdrawAndHarvest(uint256 pid, uint256 amount, address to) external;
  function harvest(uint256 pid, address to) external;

  function userInfo(
    uint256 poolId,
    address account
  ) external view returns (uint256, uint256);  
}