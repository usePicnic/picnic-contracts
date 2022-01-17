// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "../interfaces/IUniswapV2Liquidity.sol";

/**
 * @title SushiLiquidityBridge
 * @author DeFi Basket
 *
 * @notice Swaps using the Sushi contract in Polygon.
 *
 * @dev This contract adds or removes liquidity from Sushi through 2 functions:
 *
 * 1. addLiquidity works with 2 ERC20 tokens
 * 2. removeLiquidity works with 2 ERC20 tokens
 *
 */
contract SushiLiquidityBridge is IUniswapV2Liquidity {

    address constant public routerAddress = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
    address constant public factoryAddress = 0xc35DADB65012eC5796536bD9864eD8773aBc74C4;
    IUniswapV2Router02 constant _uniswapRouter = IUniswapV2Router02(routerAddress);
    IUniswapV2Factory constant _uniswapFactory = IUniswapV2Factory(factoryAddress);


    /**
      * @notice Adds liquidity from 2 ERC20 tokens
      *
      * @dev Wraps add liquidity and generate the necessary events to communicate with DeFi Basket's UI and back-end.
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

        // Receive addLiquidityETH output in a array to avoid stack too deep error
        uint256[3] memory routerOutputs;

        // [amountToken, amountETH, liquidity]
        (routerOutputs[0], routerOutputs[1], routerOutputs[2]) = _uniswapRouter.addLiquidity(
            tokens[0], //        address tokenA,
            tokens[1], //        address tokenB,
            amountA, //        uint amountADesired,
            amountB, //        uint amountBDesired,
            minAmounts[0], //        uint amountAMin,
            minAmounts[1], //        uint amountBMin,
            address(this), //  address to,
            block.timestamp + 100000  //   uint deadline
        );

        // Prepare arguments for emitting event
        uint[] memory amountTokensArray = new uint[](2);
        amountTokensArray[0] = routerOutputs[0];
        amountTokensArray[1] = routerOutputs[1];

        address assetOut = _uniswapFactory.getPair(tokens[0], tokens[1]);

        emit DEFIBASKET_UNISWAPV2_ADD_LIQUIDITY(amountTokensArray, assetOut, routerOutputs[2]);
    }

    /**
      * @notice Removes liquidity from 2 ERC20 tokens
      *
      * @dev Wraps remove liquidity and generate the necessary events to communicate with DeFi Basket's UI and
      * back-end.
      *
      * @param tokens List of two - token that will have liquidity removed from pool
      * @param percentage Percentage of LP token to be removed from pool
      * @param minAmounts List of two - minimum amounts of the ERC20 tokens required to remove liquidity
      */
    function removeLiquidity(
        address[] calldata tokens,
        uint256 percentage,
        uint256[] calldata minAmounts
    ) external override {
        address lpToken = _uniswapFactory.getPair(tokens[0], tokens[1]);
        uint256 liquidity = IERC20(lpToken).balanceOf(address(this)) * percentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(lpToken).approve(routerAddress, 0);
        IERC20(lpToken).approve(routerAddress, liquidity);

        uint[] memory amountTokensArray = new uint[](2);
        // [amountToken, amountETH, liquidity]
        (amountTokensArray[0], amountTokensArray[1]) =  _uniswapRouter.removeLiquidity(
            tokens[0], // tokenA
            tokens[1], // tokenB
            liquidity, // liquidity,
            minAmounts[0], // amountAMin
            minAmounts[1], // amountBMin
            address(this), // address to,
            block.timestamp + 100000  // uint deadline
        );

        emit DEFIBASKET_UNISWAPV2_REMOVE_LIQUIDITY(amountTokensArray, lpToken, liquidity);
    }
}
