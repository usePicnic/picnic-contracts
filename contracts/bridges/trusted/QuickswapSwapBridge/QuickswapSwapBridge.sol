pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "hardhat/console.sol";

/**
 * @title QuickswapSwapBridge
 * @author IndexPool
 *
 * @notice Swaps using the Quickswap contract in Polygon.
 *
 * @dev This contract has 3 main functions:
 *
 * 1. Swap ETH (Matic) to ERC20 tokens.
 * 2. Swap ERC20 tokens to ETH (Matic).
 * 3. Swap ERC20 tokens to ERC20 tokens.
 *
 * Notice that we haven't implemented any kind of borrowing mechanisms, mostly because that would require control
 * mechanics to go along with it.
 *
 */

contract QuickswapSwapBridge {

    address constant routerAddress = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;

    event TradedFromETHToToken(
        address[] path,
        uint256[] amounts
    );

    event TradedFromTokenToETH(
        address[] path,
        uint256[] amounts
    );

    event TradedFromTokenToToken(
        address[] path,
        uint256[] amounts
    );

    /**
      * @notice Swaps from ETH (Matic) to ERC20 token.
      *
      * @dev Wraps the swap and generate the necessary events to communicate with IndexPool's UI and back-end.
      *
      * @param amountInPercentage Percentage of the balance of input ETH (Matic) that will be swapped
      * @param amountOutMin Minimum amount of the output token required to execute swap
      * @param path The swap route determined by the path. The first element of path is the input token, the last is
      * the output token, and any intermediate elements represent intermediate pairs to trade through (if, for example,
      * a direct pair does not exist).
      */
    function tradeFromETHToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) external {
        IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

        uint256 amountIn = address(this).balance * amountInPercentage / 100000;

        uint[] memory amounts = router.swapExactETHForTokens{value : amountIn}(
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit TradedFromETHToToken(path, amounts);
    }

    /**
      * @notice Swaps from ERC20 token to ETH (Matic).
      *
      * @dev Wraps the swap and generate the necessary events to communicate with IndexPool's UI and back-end.
      *
      * @param amountInPercentage Percentage of the balance of the input ERC20 token that will be swapped
      * @param amountOutMin Minimum amount of output ETH (Matic) required to execute swap
      * @param path The swap route determined by the path. The first element of path is the input token, the last is
      * the output token, and any intermediate elements represent intermediate pairs to trade through (if, for example,
      * a direct pair does not exist).
      */
    function tradeFromTokenToETH(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) external {
        IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

        uint256 amountIn = IERC20(path[0]).balanceOf(address(this)) * amountInPercentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(path[0]).approve(routerAddress, 0);
        IERC20(path[0]).approve(routerAddress, amountIn);

        uint[] memory amounts = router.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit TradedFromTokenToETH(path, amounts);
    }

    /**
      * @notice Swaps from ERC20 token to ERC20 token.
      *
      * @dev Wraps the swap and generate the necessary events to communicate with IndexPool's UI and back-end.
      *
      * @param amountInPercentage Percentage of the balance of the input ERC20 token that will be swapped
      * @param amountOutMin Minimum amount of the output token required to execute swap
      * @param path The swap route determined by the path. The first element of path is the input token, the last is
      * the output token, and any intermediate elements represent intermediate pairs to trade through (if, for example,
      * a direct pair does not exist).
      */
    function tradeFromTokenToToken(
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) external {
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

        emit TradedFromTokenToToken(path, amounts);
    }
}
