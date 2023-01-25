// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IJarvisWrap {
    event DEFIBASKET_JARVIS_WRAP (
        uint256 amountIn,
        uint256 amountOut
    );

    event DEFIBASKET_JARVIS_UNWRAP (
        uint256 amountIn,
        uint256 amountOut
    );

    function wrap(
        address synthereumAddress,
        address assetIn,
        uint256 percentageIn,
        address assetOut)
    external;

    function unwrap(
        address synthereumAddress,
        address assetIn,
        uint256 percentageIn,
        address assetOut
    ) external;
}
