// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "./interfaces/IGauge.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BalancerGauge {

    function deposit(
        address tokenIn,
        address gaugeAddress,
        uint256 percentageIn
    ) external {
        uint256 amountIn = IERC20(tokenIn).balanceOf(address(this)) * percentageIn / 100000;
        IERC20(tokenIn).approve(gaugeAddress, 0);
        IERC20(tokenIn).approve(gaugeAddress, amountIn);
        IGauge(gaugeAddress).deposit(amountIn);   
    }

    function withdraw(
        address gaugeAddress,
        uint256 percentageOut
    ) external {
        uint256 amountOut = IERC20(gaugeAddress).balanceOf(address(this)) * percentageOut / 100000;
        IGauge(gaugeAddress).withdraw(amountOut, true);           
    }

    function claimRewards(
        address gaugeAddress
    ) external {
        IGauge(gaugeAddress).claim_rewards();   
    }   
    }