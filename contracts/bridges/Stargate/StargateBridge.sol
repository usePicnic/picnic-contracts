// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "./interfaces/StargateRouter.sol";
import "../interfaces/IStargateBridge.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

contract StargateBridge is IStargateBridge {
    address constant routerAddress = 0x45A01E4e04F14f7A4a6702c74187c5F6222033cd;
    StargateRouter stargateRoute = StargateRouter(routerAddress);

    function addLiquidity(
        uint256 amountInPercentage,
        address tokenIn,
        address tokenOut,
        uint16 _poolId
    ) external override {        
        uint256 amount = IERC20(tokenIn).balanceOf(msg.sender) * amountInPercentage / 100000;
        IERC20(tokenIn).approve(routerAddress, amount);

        uint256 outPreviousAmount = IERC20(tokenOut).balanceOf(msg.sender);

        stargateRoute.addLiquidity(_poolId, amount, msg.sender);

        emit STARGATE_ADD_LIQUIDITY(IERC20(tokenOut).balanceOf(msg.sender) - outPreviousAmount);      
    }

    function removeLiquidity(
        uint256 amountOutPercentage,
        address tokenIn,
        address tokenOut,
        uint16 _poolId
    ) external override {       
        uint256 amount = IERC20(tokenIn).balanceOf(msg.sender) * amountOutPercentage / 100000;

        stargateRoute.instantRedeemLocal(_poolId, amount, msg.sender);     

        uint256 outPreviousAmount = IERC20(tokenOut).balanceOf(msg.sender);
        
        emit STARGATE_REMOVE_LIQUIDITY(IERC20(tokenOut).balanceOf(msg.sender) - outPreviousAmount);
    }
}
