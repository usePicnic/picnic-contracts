// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IMasterChefDeposit.sol";
import "./interfaces/IRewarder.sol";
import "./interfaces/IMasterChef.sol";

contract GammaRewardsBridge is IMasterChefDeposit {
     function stake(
        address masterchefAddress,
        address tokenAddress,
        uint256 percentage,
        uint256 poolId       
    ) external override {        
        uint256 amountIn = IERC20(tokenAddress).balanceOf(address(this)) * percentage / 100_000;
        IMasterChef masterchef = IMasterChef(masterchefAddress);

        IERC20(tokenAddress).approve(masterchefAddress, 0);
        IERC20(tokenAddress).approve(masterchefAddress, amountIn);  

        (uint256 prevAmountOut, ) = masterchef.userInfo(poolId, address(this));               

        masterchef.deposit(
            poolId,
            amountIn,
            address(this)
        );

        (uint256 currentAmountOut, ) = masterchef.userInfo(poolId, address(this)); 

        emit DEFIBASKET_MASTERCHEF_STAKE(masterchefAddress, poolId, amountIn, currentAmountOut - prevAmountOut);
    }

    function unstake(
        address masterchefAddress,
        address tokenAddress,
        uint256 percentage,
        uint256 poolId
    ) external override {
        IMasterChef masterchef = IMasterChef(masterchefAddress);
        (uint256 balance, ) = masterchef.userInfo(poolId, address(this));        
        uint256 amountIn = balance * percentage / 100_000;
        uint256 prevAmountOut = IERC20(tokenAddress).balanceOf(address(this));

        masterchef.withdrawAndHarvest(
            poolId,
            amountIn,
            address(this)
        );

        address[] memory rewardTokens = _getRewardTokens(masterchefAddress);
        uint256 amountOut = IERC20(tokenAddress).balanceOf(address(this)) - prevAmountOut;

        emit DEFIBASKET_MASTERCHEF_UNSTAKE(masterchefAddress, poolId, amountIn, amountOut, rewardTokens);
    }

    function claimRewards(
        address masterchefAddress,
        uint256 poolId
    ) external override {
        IMasterChef masterchef = IMasterChef(masterchefAddress);

        masterchef.harvest(
            poolId,
            address(this)
        );

        address[] memory rewardTokens = _getRewardTokens(masterchefAddress);

        emit DEFIBASKET_MASTERCHEF_CLAIM(rewardTokens);
    }

    function _getRewardTokens(address masterchefAddress) internal view returns (address[] memory){
       address[] memory rewardTokens = new address[](20);
        uint256 rewardTokenCount = 0;

        for (uint256 i = 0; i < 20; i++) {
            try IMasterChef(masterchefAddress).getRewarder(i) returns (address rewarderAddress) {
                rewardTokens[rewardTokenCount] = IRewarder(rewarderAddress).rewardToken();
                rewardTokenCount++;
            } catch {
                break;
            }
        }

        // Resize the rewardTokens array to the actual number of reward tokens found
        assembly {
            mstore(rewardTokens, rewardTokenCount)
        }

        return rewardTokens;
    }
}
