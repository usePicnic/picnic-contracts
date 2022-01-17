// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

interface IBalancerSwap {
    event DEFIBASKET_BALANCER_SWAP(
        uint256 amountOut
    );

    function swapTokenToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        bytes32 poolId,
        address assetIn,
        address assetOut,
        bytes calldata userData
    ) external;
}
