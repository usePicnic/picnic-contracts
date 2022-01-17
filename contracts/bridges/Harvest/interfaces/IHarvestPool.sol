// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IHarvestPool {
    
    function lpToken() external returns (address);
    function rewardTokens(uint i) external returns (address);
    function rewardTokensLength() external returns(uint256);    
    function getAllRewards() external; 
    function stake(uint256 amount) external;
    function exit() external;

}
