// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IWMaticWrap {
    event DEFIBASKET_WMATIC_WRAP (
        uint256 amountIn
    );

    event DEFIBASKET_WMATIC_UNWRAP (
        uint256 amountOut
    );

    function wrap(uint256 percentageIn) external;

    function unwrap(uint256 percentageOut) external;
}
