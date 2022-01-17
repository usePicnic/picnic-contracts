// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICurveBasePool.sol";
import "../interfaces/ICurveSwap.sol";
import "hardhat/console.sol";

/**
 * @title SushiSwapBridge
 * @author DeFi Basket
 *
 * @notice Swaps using the Curve contract in Polygon.
 *
 * @dev This contract swaps ERC20 tokens to ERC20 tokens. Please notice that there are no payable functions.
 *
 */

contract CurveSwapBridge is ICurveSwap {
    
    /**
      * @notice Swaps from ERC20 token to ERC20 token using Curve pools.
      *
      * @dev This function is based on 0x protocol response, and uses a low-level call to call Curve's pools
      * in an unified way. It is assumed that poolAddress always be a valid Curve pool returned by 0x protocol.
      *
      * @param amountInPercentage Percentage of the balance of the input ERC20 token that will be swapped
      * @param amountOutMin Minimum amount of the output token required to execute swap
      * @param poolAddress Address of the pool that will be used to swap
      * @param exchangeFunctionSelector Selector of the function that will be called to swap
      * @param tokenInAddress Address of the input ERC20 token that will be swapped
      * @param tokenOutAddress Address of the output ERC20 token that will be received
      * @param fromTokenIdx Pool's index of the input ERC20 token that will be swapped
      * @param toTokenIdx Pool's index of the output ERC20 token that will be received
      */
    function swapTokenToToken(        
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address poolAddress,
        bytes4 exchangeFunctionSelector,
        address tokenInAddress,
        address tokenOutAddress,
        int128 fromTokenIdx,
        int128 toTokenIdx        
    ) external override {
        
        uint256 amountIn = IERC20(tokenInAddress).balanceOf(address(this)) * amountInPercentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(tokenInAddress).approve(poolAddress, 0);
        IERC20(tokenInAddress).approve(poolAddress, amountIn);

        // Since we do not know a priori the type of pool we are calling, we use a low-level call to call the pool.
        bytes memory data = abi.encodeWithSelector(
            exchangeFunctionSelector, /* function exchange or exchange_underlying */
            fromTokenIdx,    /* i */
            toTokenIdx,      /* j */
            amountIn,         /* _dx */
            amountOutMin     /* _min_dy */
        ); /* returns amount received (uint256) */

        console.logAddress(poolAddress);
        console.logBytes(data);

        // Some older versions of Curve lending pools may not return the amount received, thus we compute the balance of token 
        // before and after the swap to emit the event.
        uint256 balanceBefore = IERC20(tokenOutAddress).balanceOf(address(this));

        (bool isSuccess, bytes memory result) = address(poolAddress).call(data);        
        if (!isSuccess) {
            assembly {
                let ptr := mload(0x40)
                let size := returndatasize()
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }

        uint256 receivedAmount = IERC20(tokenOutAddress).balanceOf(address(this)) - balanceBefore;
        emit DEFIBASKET_CURVE_SWAP(receivedAmount);                        
    }
}
