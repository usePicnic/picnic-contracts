// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IDodoV2Swap {
    event DEFIBASKET_DODOV2_SWAP(
        uint256 amountIn,
        uint256 amountOut
    );

    function swapTokenToToken(
        address fromToken,
        address toToken,
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata dodoPairs,
        uint256 directions
    ) external;
}
