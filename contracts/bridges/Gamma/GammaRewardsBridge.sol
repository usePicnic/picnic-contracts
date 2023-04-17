// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IMasterChefDeposit.sol";
import "./interfaces/IMasterChef.sol";

contract GammaRewardsBridge is IMasterChefDeposit {
     function stake(
        address rewarderAddress,
        address tokenAddress,
        uint256 percentage,
        uint256 poolId       
    ) external override {        
        uint256 amountIn = IERC20(tokenAddress).balanceOf(address(this)) * percentage / 100_000;
        IMasterChef masterchef = IMasterChef(rewarderAddress);

        IERC20(tokenAddress).approve(rewarderAddress, 0);
        IERC20(tokenAddress).approve(rewarderAddress, amountIn);  

        uint256 prevAmountOut =  0; // masterchef.userInfo(poolId, address(this))[1];               

        masterchef.deposit(
            poolId,
            amountIn,
            address(this)
        );

        uint256 amountOut = 1; // masterchef.userInfo(poolId, address(this))[1] - prevAmountOut;

        emit DEFIBASKET_MASTERCHEF_STAKE(amountIn, amountOut);
    }

    function unstake(
        address rewarderAddress,
        address tokenAddress,
        uint256 percentage,
        uint256 poolId  
    ) external override {
        IMasterChef masterchef = IMasterChef(rewarderAddress);
        (uint256 balance, ) = masterchef.userInfo(poolId, address(this));        
        uint256 amountIn = balance * percentage / 100_000;
        uint256 prevAmountOut = IERC20(tokenAddress).balanceOf(address(this));

        masterchef.withdrawAndHarvest(
            poolId,
            amountIn,
            address(this)
        );

        uint256 amountOut = IERC20(tokenAddress).balanceOf(address(this)) - prevAmountOut;

        emit DEFIBASKET_MASTERCHEF_UNSTAKE(amountIn, amountOut);
    }

    function claimRewards(
        address rewarderAddress,
        uint256 poolId  
    ) external override {
        IMasterChef masterchef = IMasterChef(rewarderAddress);

        masterchef.harvest(
            poolId,
            address(this)
        );

        emit DEFIBASKET_MASTERCHEF_CLAIM();
    }
}
