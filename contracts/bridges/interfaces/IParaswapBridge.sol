// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "../Paraswap/interfaces/ParaswapIntefaces.sol";

interface IParaswapBridge{
    event DEFIBASKET_PARASWAP_SWAP(uint256 receivedAmount);

    function swap(
        address paraswapAddress,
        address approveAddress,
        SimpleData calldata paraswapParams,
        uint256 amountInPercentage
    ) external;
}
