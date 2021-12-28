// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IBalancerLiquidity {
    event DEFIBASKET_BALANCER_DEPOSIT(
        uint256[] amountsIn,
        uint256 liquidity
    );
    event DEFIBASKET_BALANCER_WITHDRAW(
        uint256[] tokenBalances,
        uint256 liquidity
    );

    function addLiquidity(
        bytes32 poolId,
        address[] calldata tokens,
        uint256[] calldata percentages
    ) external;

    function removeLiquidity(
        bytes32 poolId,
        uint256 percentageOut,
        uint256[] calldata minAmountsOut
    ) external;       

}
