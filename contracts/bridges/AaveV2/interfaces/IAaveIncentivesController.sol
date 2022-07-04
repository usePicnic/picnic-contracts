// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IAaveIncentivesController {
    function getRewardsBalance(address[] calldata assets, address user) external view returns (uint256);

    function claimRewards(
        address[] calldata assets,
        uint256 amount,
        address to
    ) external returns (uint256);

    function REWARD_TOKEN() external view returns (address);
}