// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IHarvestVault {

    function deposit(uint256 amount) external;
    function withdraw(uint256 numberOfShares) external; 
    function underlying() external view returns(address);

}
