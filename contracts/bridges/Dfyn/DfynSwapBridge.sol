// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "../interfaces/IUniswapV2Swap.sol";

/**
 * @title DfynSwapBridge
 * @author DeFi Basket
 *
 * @notice Swaps using the DfynSwap contract in Polygon.
 *
 * @dev This contract swaps ERC20 tokens to ERC20 tokens. Please notice that there are no payable functions.
 *
 */

contract DfynSwapBridge is IUniswapV2Swap {
    address constant routerAddress = 0xA102072A4C07F06EC3B4900FDC4C7B80b6c57429;
    /**
      * @notice Swaps from ERC20 token to ERC20 token.
      *
      * @dev Wraps the swap and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param amountInPercentage Percentage of the balance of the input ERC20 token that will be swapped
      * @param amountOutMin Minimum amount of the output token required to execute swap
      * @param path The swap route determined by the path. The first element of path is the input token, the last is
      * the output token, and any intermediate elements represent intermediate pairs to trade through (if, for example,
      * a direct pair does not exist)
      */
    function swapTokenToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) external override {
        IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

        uint256 amountIn = IERC20(path[0]).balanceOf(address(this)) * amountInPercentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(path[0]).approve(routerAddress, 0);
        IERC20(path[0]).approve(routerAddress, amountIn);

        uint[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit DEFIBASKET_UNISWAPV2_SWAP(amounts);
    }
}
