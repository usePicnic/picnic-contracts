// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ICurveLiquidity {
    event DEFIBASKET_CURVE_ADD_LIQUIDITY(
        uint256[] amountsIn,
        uint256 liquidity
    );

    event DEFIBASKET_CURVE_REMOVE_LIQUIDITY(
        uint256[] tokenAmountsOut,
        uint256 liquidity
    );

    // Note: function addLiquidity does not stakes the LP token
    function addLiquidity(
        address poolAddress,
        address[] memory tokens,
        uint256[] calldata percentages,
        uint256 minAmountOut
    ) external;

    function removeLiquidity(
        address poolAddress,
        uint256 percentageOut,
        uint256[] calldata minAmountsOut
    ) external;
}
