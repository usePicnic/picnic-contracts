// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface StargateRouter{
    function addLiquidity(
        uint256 _poolId,
        uint256 _amountLD,
        address _to
    ) external;

    function instantRedeemLocal(
        uint16 _srcPoolId, 
        uint256 _amountLP,
        address _to
    ) external;
}
