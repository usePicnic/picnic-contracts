// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ICurveSwap {
    event DEFIBASKET_CURVE_SWAP(
        uint256 amountIn,
        uint256 amountOut
    );

    function swapTokenToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address poolAddress,
        bytes4 exchangeFunctionSelector,
        address tokenInAddress,
        address tokenOutAddress,
        int128 fromTokenIdx,
        int128 toTokenIdx
    ) external;
}
