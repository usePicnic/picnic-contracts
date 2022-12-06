// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

interface IBalancerBatchSwap {

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

    function batchSwap(
        bytes32 poolId, 
        uint256 percentageIn,    
        address[] calldata assets,
        uint256 minAmountOut
    ) external;
}
