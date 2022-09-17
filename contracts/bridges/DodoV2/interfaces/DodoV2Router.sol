// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;


interface DodoV2Router {
    function dodoSwapV2TokenToToken(address fromToken,
        address toToken,
        uint256 fromTokenAmount,
        uint256 minReturnAmount,
        address[] memory dodoPairs,
        uint256 directions,
        bool isIncentive,
        uint256 deadLine
    ) external returns (uint256 returnAmount);

    function _DODO_APPROVE_PROXY_() external returns (address);
}
