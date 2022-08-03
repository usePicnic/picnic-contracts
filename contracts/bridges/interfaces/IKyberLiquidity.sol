// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IKyberLiquidity {
    event DEFIBASKET_KYBER_ADD_LIQUIDITY(
        uint256[] amountIn,
        uint256 liquidity
    );

    event DEFIBASKET_KYBER_ADD_LIQUIDITY_ONE_COIN(
        uint256 amountIn,
        uint256 amountOut
    );

    event DEFIBASKET_KYBER_REMOVE_LIQUIDITY(
        uint256[] amountOut,
        address poolAddress,
        uint256 liquidity
    );

    event DEFIBASKET_KYBER_REMOVE_LIQUIDITY_ONE_COIN(
        uint256 amountIn,
        uint256 amountOut
    );

    function addLiquidity(
        address[] calldata tokens,
        address poolAddress,
        uint256[] calldata percentages,
        uint256[] calldata minAmounts,
        uint256[2] calldata vReserveRatioBounds
    )  external;

    function addLiquidityOneCoin(
        address tokenIn,
        address tokenOut,
        address poolAddress,
        uint256 percentage,
        uint256 minAmount
    ) external;

    function removeLiquidity(
        address[] calldata tokens,
        address poolAddress,
        uint256 percentage,
        uint256[] calldata minAmounts
    ) external;

    function removeLiquidityOneCoin(
        address tokenIn,
        address tokenOut,
        address poolAddress,
        uint256 percentage,
        uint256 minAmount
    ) external;
}
