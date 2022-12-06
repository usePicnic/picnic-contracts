// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;
interface IGauge {
    function deposit(uint256 _value) external;
    function withdraw(uint256 _value, bool _claim_rewards) external;
    function claim_rewards() external;
}