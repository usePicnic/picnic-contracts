// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;


interface ZapOut {
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