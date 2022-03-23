// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IKyberDMM {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata poolsPath,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}