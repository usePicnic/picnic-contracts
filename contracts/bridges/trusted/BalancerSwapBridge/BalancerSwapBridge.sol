// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ISwap.sol";
import "../../interfaces/IBalancerSwap.sol";
import "hardhat/console.sol";

/**
 * @title BalancerLiquidityBridge
 * @author DeFi Basket
 *
 * @notice Adds/remove liquidity from Balancer pools
 *
 * @dev This contract adds or removes liquidity from Balancer pools through 2 functions:
 *
 * 1. addLiquidity works with multiple ERC20 tokens
 * 2. removeLiquidity works with multiple ERC20 tokens
 *
 */
contract BalancerSwapBridge is IBalancerSwap {

    address constant balancerV2Address = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;    
    ISwap constant _balancerVault = ISwap(balancerV2Address);    

    /**
      * @notice Swaps from ERC20 token to ERC20 token using Balancer pools.
      *
      * @dev This function is based on 0x protocol response, and assumes that poolId will always be a valid
      * ID returned by 0x protocol.
      *
      * @param amountInPercentage Percentage of the balance of the input ERC20 token that will be swapped
      * @param amountOutMin Minimum amount of the output token required to execute swap
      * @param poolId ID of the pool that will be used to swap (provided by 0x)
      * @param assetIn Address of the input ERC20 token that will be swapped
      * @param assetOut Address of the output ERC20 token that will be received
      * @param userData Any additional data which the pool requires to perform the swap.
      */
    function swapTokenToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        bytes32 poolId,
        address assetIn,
        address assetOut,
        bytes calldata userData
    ) external override {
        
        uint256 amountIn = IERC20(assetIn).balanceOf(address(this)) * amountInPercentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(balancerV2Address, 0);
        IERC20(assetIn).approve(balancerV2Address, amountIn);

        ISwap.SingleSwap memory singleSwap = ISwap.SingleSwap(
            poolId,
            ISwap.SwapKind.GIVEN_IN,
            assetIn,
            assetOut,
            amountIn,
            userData
        );

        ISwap.FundManagement memory funds = ISwap.FundManagement(
            address(this),          // sender
            false,                  // fromInternalBalance 
            payable(address(this)), // recipient
            false                   // toInternalBalance
        );

        console.log("Address(this)");
        console.log(address(this));
        console.log("msg.sender");
        console.log(msg.sender);
        bytes memory data = abi.encodeWithSelector(
            0x52bbbe29, 
            singleSwap,
            funds,
            amountOutMin,
            block.timestamp + 100000
        );
        console.log("Encoded data");
        console.logBytes(data);        

        uint256 amountOut = _balancerVault.swap(
            singleSwap, 
            funds,
            amountOutMin,
            block.timestamp + 100000
        );

        emit DEFIBASKET_BALANCER_SWAP(amountOut);
    }   

}





