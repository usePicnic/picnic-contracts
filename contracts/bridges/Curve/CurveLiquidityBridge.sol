// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICurveBasePool.sol";
import "./interfaces/ICurveRewardGauge.sol";
import "./interfaces/ICurveAddressRegistry.sol";
import "./interfaces/ICurvePoolsRegistry.sol";
import "../interfaces/ICurveLiquidity.sol";

/**
 * @title CurveLiquidityBridge
 * @author DeFi Basket
 *
 * @notice Adds/remove liquidity from Curve pools
 *
 * @dev This contract adds or removes liquidity from Curve pools 
 *
 */
contract CurveLiquidityBridge is ICurveLiquidity {

    address constant curveAddressRegistry = 0x0000000022D53366457F9d5E68Ec105046FC4383;    
    ICurveAddressRegistry constant _addressRegistry = ICurveAddressRegistry(curveAddressRegistry);

    /**
      * @notice Joins a Curve pool using multiple ERC20 tokens and stake the received LP token
      *
      * @dev Wraps add_liquidity and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *      Note: This function does not automatically stake the LP token.
      *      Note: This function could be optimized if we remove `tokens` argument 
      *
      * @param poolAddress The address of the pool that Wallet will join
      * @param tokens Tokens that will be added to pool. Should be sorted according to the Curve's pool order, otherwise function will revert 
      * @param percentages Percentages of the balance of ERC20 tokens that will be added to the pool. 
      * @param minimumLPout Minimum amount of LP token that should be received from the pool
      */
    function addLiquidity(
        address poolAddress, 
        address[] calldata tokens, /* Must be in the same order as the array returned by underlying_coins (or coins) */
        uint256[] calldata percentages,
        uint256 minimumLPout
    ) external override {

        uint256 numTokens = uint256(tokens.length);

        // Get order of array from registry
        address registry = _addressRegistry.get_registry();
        ICurvePoolsRegistry poolRegistry = ICurvePoolsRegistry(registry);
        address[8] memory poolTokens = poolRegistry.get_underlying_coins(poolAddress);

        uint256[] memory amountsIn = new uint256[](numTokens);    
        for (uint256 i = 0; i < numTokens; i = unchecked_inc(i)) {  
            require(tokens[i] == poolTokens[i], "Tokens must be in the same order as the array returned by underlying_coins (or coins)");

            amountsIn[i] = IERC20(tokens[i]).balanceOf(address(this)) * percentages[i] / 100_000;
            // Approve 0 first as a few ERC20 tokens are requiring this pattern.
            IERC20(tokens[i]).approve(poolAddress, 0);
            IERC20(tokens[i]).approve(poolAddress, amountsIn[i]);
        }                

        // Call the correct add_liquidity function according to tokens array size
        uint256 LPTokenReceived;
        if(numTokens == 2){
            uint256[2] memory amts = [amountsIn[0], amountsIn[1]];
            LPTokenReceived = ICurveBasePool(poolAddress).add_liquidity(amts, minimumLPout, true);
        }else if(numTokens == 3){    
            uint256[3] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2]];
            LPTokenReceived = ICurveBasePool(poolAddress).add_liquidity(amts, minimumLPout, true);
        }else if(numTokens == 4){
            uint256[4] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3]];
            LPTokenReceived = ICurveBasePool(poolAddress).add_liquidity(amts, minimumLPout, true);
        }else if(numTokens == 5){
            uint256[5] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3], amountsIn[4]];
            LPTokenReceived = ICurveBasePool(poolAddress).add_liquidity(amts, minimumLPout, true);
        }else if(numTokens == 6){
            uint256[6] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3], amountsIn[4], amountsIn[5]];
            LPTokenReceived = ICurveBasePool(poolAddress).add_liquidity(amts, minimumLPout, true);
        }else if(numTokens == 7){
            uint256[7] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3], amountsIn[4], amountsIn[5], amountsIn[6]];
            LPTokenReceived = ICurveBasePool(poolAddress).add_liquidity(amts, minimumLPout, true);
        }else if(numTokens == 8){
            uint256[8] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3], amountsIn[4], amountsIn[5], amountsIn[6], amountsIn[7]];
            LPTokenReceived = ICurveBasePool(poolAddress).add_liquidity(amts, minimumLPout, true);
        }else{
            revert("Unsupported number of tokens");
        }     
                                                      
        // Emit event        
        emit DEFIBASKET_CURVE_DEPOSIT(LPTokenReceived); 
    }  

    /**
      * @notice Unstake LP token from a Curve pool and withdraw assets
      *
      * @dev Wraps withdraw/remove_liquidity and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param poolAddress The address of the pool that Wallet will withdraw assets
      * @param percentageOut Percentages of LP token that will be withdrawn from the pool.
      * @param minAmountsOut Minimum amount of tokens that should be received from the pool. Should be in the same order than underlying_coins from the pool
      */
    function removeLiquidity(
        address poolAddress,
        uint256 percentageOut,
        uint256[] calldata minAmountsOut
    ) external override {   

        uint256 numTokens = minAmountsOut.length;

        address LPtokenAddress = ICurveBasePool(poolAddress).lp_token();
        uint256 liquidity = IERC20(LPtokenAddress).balanceOf(address(this)) * percentageOut / 100_000; 

        // Get pool tokens - TODO: Check if necessary for communication with backend
        address[] memory tokens = new address[](numTokens);
        for(uint256 i = 0; i < numTokens; i = unchecked_inc(i)) {
            tokens[i] = ICurveBasePool(poolAddress).underlying_coins(i);
        }        
        uint256[] memory amountsOut = new uint256[](numTokens);

        // Call the correct remove_liquidity interface according to tokens array size
        if(numTokens == 2){            
            uint256[2] memory min_amts = [minAmountsOut[0], minAmountsOut[1]];
            uint256[2] memory tokensAmountsOut = ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts);     
            amountsOut[0] = tokensAmountsOut[0];
            amountsOut[1] = tokensAmountsOut[1];
        }else if(numTokens == 3){    
            uint256[3] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2]];
            uint256[3] memory tokensAmountsOut = ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts);
            amountsOut[0] = tokensAmountsOut[0];
            amountsOut[1] = tokensAmountsOut[1];
            amountsOut[2] = tokensAmountsOut[2];                        
        }else if(numTokens == 4){
            uint256[4] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3]];
            uint256[4] memory tokensAmountsOut = ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts);
            amountsOut[0] = tokensAmountsOut[0];
            amountsOut[1] = tokensAmountsOut[1];
            amountsOut[2] = tokensAmountsOut[2];          
            amountsOut[3] = tokensAmountsOut[3];            
        }else if(numTokens == 5){
            uint256[5] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3], minAmountsOut[4]];
            uint256[5] memory tokensAmountsOut = ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts);
            amountsOut[0] = tokensAmountsOut[0];
            amountsOut[1] = tokensAmountsOut[1];
            amountsOut[2] = tokensAmountsOut[2];          
            amountsOut[3] = tokensAmountsOut[3];                        
            amountsOut[4] = tokensAmountsOut[4];
        }else if(numTokens == 6){
            uint256[6] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3], minAmountsOut[4], minAmountsOut[5]];
            uint256[6] memory tokensAmountsOut = ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts);
            amountsOut[0] = tokensAmountsOut[0];
            amountsOut[1] = tokensAmountsOut[1];
            amountsOut[2] = tokensAmountsOut[2];          
            amountsOut[3] = tokensAmountsOut[3];                        
            amountsOut[4] = tokensAmountsOut[4];           
            amountsOut[5] = tokensAmountsOut[5];
        }else if(numTokens == 7){
            uint256[7] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3], minAmountsOut[4], minAmountsOut[5], minAmountsOut[6]];
            uint256[7] memory tokensAmountsOut = ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts);
            amountsOut[0] = tokensAmountsOut[0];
            amountsOut[1] = tokensAmountsOut[1];
            amountsOut[2] = tokensAmountsOut[2];          
            amountsOut[3] = tokensAmountsOut[3];                        
            amountsOut[4] = tokensAmountsOut[4];           
            amountsOut[5] = tokensAmountsOut[5];           
            amountsOut[6] = tokensAmountsOut[6];
        }else if(numTokens == 8){
            uint256[8] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3], minAmountsOut[4], minAmountsOut[5], minAmountsOut[6], minAmountsOut[7]];
            uint256[8] memory tokensAmountsOut = ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts);
            amountsOut[0] = tokensAmountsOut[0];
            amountsOut[1] = tokensAmountsOut[1];
            amountsOut[2] = tokensAmountsOut[2];          
            amountsOut[3] = tokensAmountsOut[3];                        
            amountsOut[4] = tokensAmountsOut[4];           
            amountsOut[5] = tokensAmountsOut[5];           
            amountsOut[6] = tokensAmountsOut[6];           
            amountsOut[7] = tokensAmountsOut[7];           
        }else{
            revert("Unsupported number of tokens");
        }     

        // Emit event        
        emit DEFIBASKET_CURVE_REMOVE_LIQUIDITY(
            tokens,
            amountsOut,
            liquidity
        );                   
    }

    /**
      * @notice Stake the LP token associated to a pool in its corresponding reward gauge
      *
      * @dev Wraps ICurveRewardGauge's deposit and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param poolAddress The address of the pool associated to the reward gauge
      * @param percentageToStake Percentages of the balance of ERC20 tokens that will be staked. 
      */
    function stakeInRewardGauge(
        address poolAddress,
        uint256 percentageToStake
    ) external override {
                
        address LPtokenAddress = ICurveBasePool(poolAddress).lp_token();
        address gaugeAddress = getAssociatedGauge(poolAddress);

        uint256 stakeAmountIn = IERC20(gaugeAddress).balanceOf(address(this)) * percentageToStake / 100_000;         

        IERC20(LPtokenAddress).approve(gaugeAddress, stakeAmountIn);
        ICurveRewardGauge(gaugeAddress).deposit(stakeAmountIn, address(this));

        emit DEFIBASKET_CURVE_STAKE(stakeAmountIn);
    }

    /**
      * @notice Unstake the LP token associated to a pool in its corresponding reward gauge
      *
      * @dev Wraps ICurveRewardGauge's withdraw and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param poolAddress The address of the pool associated to the reward gauge
      * @param percentageOut Percentages of the balance of ERC20 tokens that will be unstaked. 
      */
    function withdrawFromRewardGauge(
        address poolAddress,
        uint256 percentageOut
    ) external override {                       

        address gaugeAddress = getAssociatedGauge(poolAddress);

        address[] memory rewardsTokens;
        uint256[] memory rewardsGain;
        uint256 maxRewards = 0;
        for(uint256 i = 0; i < 8; i = unchecked_inc(i)){
            if(ICurveRewardGauge(gaugeAddress).reward_tokens(i) == address(0)){
                maxRewards = i;
                break;
            }
            rewardsTokens[i] = ICurveRewardGauge(gaugeAddress).reward_tokens(i);
            rewardsGain[i] = IERC20(rewardsTokens[i]).balanceOf(address(this));
        }

        
        uint256 stakeAmountOut = IERC20(gaugeAddress).balanceOf(address(this)) * percentageOut / 100_000; 
        ICurveRewardGauge(gaugeAddress).withdraw(stakeAmountOut, true);

        for(uint256 i = 0; i < maxRewards; i = unchecked_inc(i)){
            rewardsGain[i] = IERC20(rewardsTokens[i]).balanceOf(address(this)) - rewardsGain[i];
        }

        emit DEFIBASKET_CURVE_UNSTAKE(stakeAmountOut, rewardsTokens, rewardsGain);
    }    

    /**
    * @notice Checks Curve's registry for the associated gauge to a pool
    *
    * @param poolAddress The address of the pool to be check in registry
    */
    function getAssociatedGauge(address poolAddress) internal view returns (address gaugeAddress) {
        address registry = _addressRegistry.get_registry();
        ICurvePoolsRegistry poolRegistry = ICurvePoolsRegistry(registry);
        address[10] memory liqGauge = poolRegistry.get_gauges(poolAddress);
        gaugeAddress = liqGauge[0];
    }        

    /**
      * @notice Increment integer without checking for overflow - only use in loops where you know the value won't overflow
      *
      * @param i Integer to be incremented
    */
    function unchecked_inc(uint256 i) internal pure returns (uint256) {
        unchecked {
            return i + 1;
        }
    }

}





