// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import "../interfaces/IUniswapV3Swap.sol";

contract UniswapV3SwapBridge is IUniswapV3Swap {
    address constant routerAddress = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    ISwapRouter swapRouter = ISwapRouter(routerAddress);

    function swapTokenToToken(
        bytes calldata encodedCall,
        address[] calldata path,
        uint256 amountInPercentage,
        uint256 minAmountOut)
    external override {
        uint256 amountIn = IERC20(path[0]).balanceOf(address(this)) * amountInPercentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(path[0]).approve(routerAddress, 0);
        IERC20(path[0]).approve(routerAddress, amountIn);

        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path : encodedCall,
            recipient : address(this),
            deadline : block.timestamp + 100000,
            amountIn : amountIn,
            amountOutMinimum : minAmountOut
        });

        uint256 amountOut = swapRouter.exactInput(params);
        emit DEFIBASKET_UNISWAPV3_SWAP(amountIn, amountOut);
    }
}
