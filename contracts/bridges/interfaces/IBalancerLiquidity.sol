// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

interface IBalancerLiquidity {
    event DEFIBASKET_BALANCER_DEPOSIT(
        bytes32 poolId,
        uint256[] amountsIn,
        uint256 liquidity
    );
    event DEFIBASKET_BALANCER_WITHDRAW(
        bytes32 poolId,
        uint256[] tokenBalances,
        uint256 liquidity
    );

    function addLiquidity(
        address poolAddress,
        address[] calldata tokens,
        uint256[] calldata percentages
    ) external;

    function removeLiquidity(
        address poolAddress,
        uint256 percentageOut,
        uint256[] calldata minAmountsOut
    ) external;       

}
