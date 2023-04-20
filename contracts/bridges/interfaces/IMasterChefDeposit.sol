// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IMasterChefDeposit {
    event DEFIBASKET_MASTERCHEF_STAKE(
        uint256 poolId,
        uint256 amountIn,
        uint256 amountOut
    );
    event DEFIBASKET_MASTERCHEF_UNSTAKE(
        uint256 poolId,
        uint256 amountIn,
        uint256 amountOut,
        address[] rewardTokens
    );
    event DEFIBASKET_MASTERCHEF_CLAIM(  
        address[] rewardTokens
    );

    function stake(
        address rewarderAddress,
        address tokenAddress,
        uint256 percentage,
        uint256 poolId       
    ) external;

    function unstake(
        address rewarderAddress,
        address tokenAddress,
        uint256 percentage,
        uint256 poolId  
    ) external;

    function claimRewards(
        address rewarderAddress,
        uint256 poolId  
    ) external;
}
