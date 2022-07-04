// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

interface IBalancerLiquidity {

    event DEFIBASKET_BALANCER_ADD_LIQUIDITY(
        bytes32 poolId,
        uint256[] amountsIn,
        uint256 liquidity
    );

    event DEFIBASKET_BALANCER_REMOVE_LIQUIDITY(
        bytes32 poolId,
        address[] tokens,
        uint256[] tokenAmountsOut,
        uint256 liquidity
    );

    function addLiquidity(
        address poolAddress,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256 minimumBPTout
    ) external;

    function removeLiquidity(
        address poolAddress,
        uint256 percentageOut,
        uint256[] calldata minAmountsOut
    ) external;       

}
