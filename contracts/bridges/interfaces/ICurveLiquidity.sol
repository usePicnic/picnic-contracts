// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ICurveLiquidity {
    event DEFIBASKET_CURVE_DEPOSIT(
        uint256 LPTokenReceived
    );

    event DEFIBASKET_CURVE_REMOVE_LIQUIDITY(
        address[] tokens,
        uint256[] tokenAmountsOut,
        uint256 liquidity
    );          

    event DEFIBASKET_CURVE_STAKE(
        uint256 stakeAmountIn
    );

    event DEFIBASKET_CURVE_UNSTAKE(
        uint256 stakeAmountOut,
        address[] rewardsTokens,
        uint256[] rewardsGain
    );      

    // Note: function addLiquidity does not stakes the LP token
    function addLiquidity(
        address poolAddress, 
        address[] memory tokens,
        uint256[] calldata percentages,
        uint256 minimumLPout
    ) external;

    function removeLiquidity(
        address poolAddress,
        uint256 percentageOut,
        uint256[] calldata minAmountsOut
    ) external;     

    function stakeInRewardGauge(
        address poolAddress,
        uint256 percentageToStake
    ) external;

    function withdrawFromRewardGauge(
        address poolAddress,
        uint256 percentageOut
    ) external;

}
