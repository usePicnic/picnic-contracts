// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "../OneInch/interfaces/OneInchInterfaces.sol";

interface IOneInchBridge {
    event DEFIBASKET_ONEINCH_SWAP(
        uint256 spentAmount,
        uint256 returnAmount
    );

    function swap(
            address oneInchAddress,
            uint256 minReturnAmount,
            IAggregationExecutor executor,
            SwapDescription calldata desc,
            bytes calldata permit,
            bytes calldata data
        )
    external;
}
