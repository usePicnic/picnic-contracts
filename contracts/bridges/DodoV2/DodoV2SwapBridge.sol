// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "./interfaces/DodoV2Router.sol";
import "./interfaces/DodoV2Approve.sol";
import "../interfaces/IDodoV2Swap.sol";
/**
 * @title DodoV2SwapBridge
 * @author DeFi Basket
 *
 * @notice Swaps using the DodoV2 contract in Polygon.
 *
 * @dev This contract swaps ERC20 tokens to ERC20 tokens. Please notice that there are no payable functions.
 *
 */
/// @custom:security-contact hi@defibasket.org
contract DodoV2SwapBridge is IDodoV2Swap {
    address constant routerAddress = 0xa222e6a71D1A1Dd5F279805fbe38d5329C1d0e70;
    DodoV2Router constant router = DodoV2Router(routerAddress);
    /**
      * @notice Swaps from ERC20 token to ERC20 token.
      *
      * @dev Wraps the swap and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param amountInPercentage Percentage of the balance of the input ERC20 token that will be swapped
      * @param amountOutMin Minimum amount of the output token required to execute swap
      */
    function swapTokenToToken(
        address fromToken,
        address toToken,
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata dodoPairs,
        uint256 directions
    ) external override {     
        uint256 amountIn = IERC20(fromToken).balanceOf(address(this)) * amountInPercentage / 100000;
        address approveAddress = DodoV2Approve(router._DODO_APPROVE_PROXY_())._DODO_APPROVE_();

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(fromToken).approve(approveAddress, 0);
        IERC20(fromToken).approve(approveAddress, amountIn);

        uint256 amountOut = router.dodoSwapV2TokenToToken(
            fromToken,
            toToken,
            amountIn,
            amountOutMin,
            dodoPairs,
            directions,
            false,
            block.timestamp + 100000            
        );

        emit DEFIBASKET_DODOV2_SWAP(amountIn, amountOut);
    }
}
