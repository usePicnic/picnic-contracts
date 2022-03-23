// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IUniswapV3Swap {
    event DEFIBASKET_UNISWAPV3_SWAP(
        uint256 amountIn,
        uint256 amountOut
    );

    function swapTokenToToken(
        bytes calldata encodedCall,
        address[] calldata path,
        uint256 amountInPercentage,
        uint256 minAmountOut
    ) external;
}