// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;


interface IStargateBridge {
    event STARGATE_ADD_LIQUIDITY(
        uint256 amount
    );

    event STARGATE_REMOVE_LIQUIDITY(
        uint256 amount
    );

    function addLiquidity(
        uint256 amountInPercentage,
        address tokenIn,
        address tokenOut,
        uint256 _poolId
    ) external;

    function removeLiquidity(
        uint256 amountOutPercentage,
        address tokenIn,
        address tokenOut,
        uint16 _poolId
    ) external;
}
