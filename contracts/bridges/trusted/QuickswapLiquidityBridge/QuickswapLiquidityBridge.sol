pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "../../interfaces/ILiquidity.sol";

/**
 * @title QuickswapLiquidityBridge
 * @author IndexPool
 *
 * @notice Swaps using the Quickswap contract in Polygon.
 *
 * @dev This contract adds liquidity to Quickswap through 2 functions:
 *
 * 1. addLiquidity works with 2 ERC20 tokens
 * 2. addLiquidityETH works with 1 ERC20 token plus ETH
 *
 */
contract QuickswapLiquidityBridge is ILiquidity {

    address constant routerAddress = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    address constant factoryAddress = 0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32;
    IUniswapV2Router02 constant _uniswapRouter = IUniswapV2Router02(routerAddress);
    IUniswapV2Factory constant _uniswapFactory = IUniswapV2Factory(factoryAddress);

    /**
      * @notice Adds liquidity from 2 ERC20 tokens
      *
      * @dev Wraps add liquidity and generate the necessary events to communicate with IndexPool's UI and back-end.
      *
      * @param tokens List of two - token that will have liquidity added to pool
      * @param percentages List of two - percentages of the balance of ERC20 tokens that will be added to the pool
      * @param minAmounts List of two - minimum amounts of the ERC20 tokens required to add liquidity
      */
    function addLiquidity(
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[] calldata minAmounts
    ) external override {

        uint256 amountA = IERC20(tokens[0]).balanceOf(address(this)) * percentages[0] / 100000;
        uint256 amountB = IERC20(tokens[1]).balanceOf(address(this)) * percentages[1] / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(tokens[0]).approve(routerAddress, 0);
        IERC20(tokens[0]).approve(routerAddress, amountA);

        IERC20(tokens[1]).approve(routerAddress, 0);
        IERC20(tokens[1]).approve(routerAddress, amountB);

        (, , uint liquidity) = _uniswapRouter.addLiquidity(
            tokens[0], //        address tokenA,
            tokens[1], //        address tokenB,
            amountA, //        uint amountADesired,
            amountB, //        uint amountBDesired,
            minAmounts[0], //        uint amountAMin,
            minAmounts[1], //        uint amountBMin,
            address(this), //  address to,
            block.timestamp + 100000  //   uint deadline
        );

        address assetOut = _uniswapFactory.getPair(tokens[0], tokens[1]);

        // todo percentages to amounts
        emit IndexPool_Liquidity_Add(tokens, percentages, assetOut, liquidity);
    }

    /**
      * @notice Adds liquidity from ETH and ERC20 token
      *
      * @dev Wraps add liquidity and generate the necessary events to communicate with IndexPool's UI and back-end.
      *
      * @param ethPercentage Percentage of the balance of input ETH (Matic) that will be added to liquidity pool
      * @param minAmountEth Minimum amount of the input token required to add liquidity
      * @param tokens List of one - token that will have liquidity added alongside ETH (Matic)
      * @param percentages List of one - percentage of the balance of the ERC20 token that will be added to pool
      * @param minAmounts List of one - minimum amount of the ERC20 token required to add liquidity
      */
    function addLiquidityETH(
        uint256 ethPercentage,
        uint256 minAmountEth,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[] calldata minAmounts
    ) external override {

        uint256 amountToken = IERC20(tokens[0]).balanceOf(address(this)) * percentages[0] / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(tokens[0]).approve(routerAddress, 0);
        IERC20(tokens[0]).approve(routerAddress, amountToken);

        _uniswapRouter.addLiquidityETH{
        value : address(this).balance * ethPercentage / 100000}(
            tokens[0], //       address token,
            amountToken, //       uint amountTokenDesired,
            minAmounts[0], //        uint amountTokenMin,
            minAmountEth, //        uint amountETHMin,
            address(this), //  address to,
            block.timestamp + 100000  //   uint deadline
        );

        // TODO emit event and fix stack too deep error
        //emit AddLiquidityFromETH (ethAmount, assetIn, amountIn, assetOut, amountOut);
    }
}
