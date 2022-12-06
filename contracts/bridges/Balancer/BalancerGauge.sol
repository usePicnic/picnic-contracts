// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "./interfaces/IGauge.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BalancerGauge {    
    event DEFIBASKET_CLAIM_REWARDS(
        address[] tokens
    );    

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
        address tokenOut,
        address gaugeAddress,
        uint256 percentageOut
    ) external {
        uint256 amountOut = IERC20(gaugeAddress).balanceOf(address(this)) * percentageOut / 100000;
        IGauge(gaugeAddress).withdraw(amountOut, true);   

        address[] memory rewards = new address[](8);
        for (uint256 i = 0; i < 8; i++) {
            address rewardToken = IGauge(gaugeAddress).reward_tokens(i);
            if (rewardToken == address(0)) {
                break;
            }
            rewards[i] = rewardToken;
        }

        emit DEFIBASKET_CLAIM_REWARDS(rewards);        
    }

    function claimRewards(
        address gaugeAddress
    ) external {
        IGauge(gaugeAddress).claim_rewards();         

        address[] memory rewards = new address[](8);
        for (uint256 i = 0; i < 8; i++) {
            address rewardToken = IGauge(gaugeAddress).reward_tokens(i);
            if (rewardToken == address(0)) {
                break;
            }
            rewards[i] = rewardToken;
        }

        emit DEFIBASKET_CLAIM_REWARDS(rewards);        
    }   
    }