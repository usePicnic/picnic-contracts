// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ITetuVault {

    function depositAndInvest(uint256 amount) external;
    function exit() external; // Withdraw all and claim rewards
    function withdraw(uint256 numberOfShares) external;
    function getAllRewards() external; // Claim all rewards
    function underlying() external returns (address);
    function rewardTokens() external returns (address[] memory);
    function rewardTokensLength() external returns (uint256);

}
