// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;


interface Zap {
    function zapIn(
        address tokenIn,
        address tokenOut,
        uint256 userIn,
        address pool,
        address to,
        uint256 minLpQty,
        uint256 deadline
    ) external returns (uint256 lpQty);

    function zapOut(
        address tokenIn,
        address tokenOut,
        uint256 liquidity,
        address pool,
        address to,
        uint256 minTokenOut,
        uint256 deadline
    ) external returns (uint256 amountOut);
}