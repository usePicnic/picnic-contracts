// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ICurveLiquidity {
    event DEFIBASKET_CURVE_DEPOSIT(
        uint256 LPTokenReceived
    );

    function addLiquidity(
        address poolAddress, 
        address[] memory tokens,
        uint256[] calldata percentages,
        uint256 minimumLPout
    ) external;
    
}
