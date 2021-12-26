// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IBalancerLiquidity {
    event DEFIBASKET_BALANCER_DEPOSIT(
    );
    event DEFIBASKET_BALANCER_WITHDRAW(
    );

    function addLiquidity(
        bytes32 poolId,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[] calldata maxAmountsIn
    ) external;

    function removeLiquidity(
        bytes32 poolId,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[] calldata minAmountsOut
    ) external;       

}
