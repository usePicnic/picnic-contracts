// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICurveBasePool.sol";
import "./interfaces/ICurveRewardGauge.sol";
import "../interfaces/ICurveLiquidity.sol";
import "hardhat/console.sol";

/**
 * @title BalancerLiquidityBridge
 * @author DeFi Basket
 *
 * @notice Adds/remove liquidity from Curve pools
 *
 * @dev This contract adds or removes liquidity from Curve pools 
 *
 */
contract CurveLiquidityBridge is ICurveLiquidity {

    /**
      * @notice Joins a Curve pool using multiple ERC20 tokens and stake the received LP token
      *
      * @dev Wraps add_liquidity and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param poolAddress The address of the pool that Wallet will join
      * @param tokens TODO: Check if it can be removed
      * @param percentages Percentages of the balance of ERC20 tokens that will be added to the pool.
      * @param minimumLPout Minimum amount of LP token that should be received from the pool
      */
    function addLiquidity(
        address poolAddress, 
        address[] memory tokens, /* Must be in the same order as the array returned by underlying_coins (or coins) */
        uint256[] calldata percentages,
        uint256 minimumLPout
    ) external override {

        uint8 numTokens = uint8(tokens.length);

        uint256[] memory amountsIn = new uint256[](numTokens);
        for (uint8 i = 0; i < numTokens; i++) { 
            amountsIn[i] = IERC20(tokens[i]).balanceOf(address(this)) * percentages[i] / 100_000;
            // Approve 0 first as a few ERC20 tokens are requiring this pattern.
            IERC20(tokens[i]).approve(poolAddress, 0);
            IERC20(tokens[i]).approve(poolAddress, amountsIn[i]);
        }         

        // Add liquidity to LP in poolAddress
        uint256 LPTokenReceived = ICurveBasePool(poolAddress).add_liquidity(amountsIn, minimumLPout);

        // Stake LP token
        address LPtokenAddress = ICurveBasePool(poolAddress).lp_token();
        address liqGauge = ICurveBasePool(poolAddress).reward_receiver();

        IERC20(LPtokenAddress).approve(liqGauge, LPTokenReceived);
        ICurveRewardGauge(liqGauge).deposit(LPTokenReceived, address(this));
                                      
        // Emit event        
        emit DEFIBASKET_CURVE_DEPOSIT(LPTokenReceived); 
    }

   // TODO: Add function to remove liquidity

}





