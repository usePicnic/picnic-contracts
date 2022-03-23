// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IKyberLiquidity {
    event DEFIBASKET_KYBER_ADD_LIQUIDITY(
        uint256[] amountIn,
        uint256 liquidity
    );

//    event DEFIBASKET_KYBER_REMOVE_LIQUIDITY(
//        uint256[] amountOut,
//        uint256 liquidity
//    );

    function addLiquidity(
        address[] calldata tokens,
        address poolAddress,
        uint256[] calldata percentages,
        uint256[] calldata minAmounts,
        uint256[2] calldata vReserveRatioBounds
    )  external;

//    function removeLiquidity(
//        address[] calldata tokens,
//        uint256 percentage,
//        uint256[] calldata minAmounts
//    ) external;
}
