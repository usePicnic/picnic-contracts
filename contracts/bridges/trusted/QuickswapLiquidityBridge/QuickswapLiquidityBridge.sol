pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "../../interfaces/ILiquidity.sol";

// TODO this bridge is work in progress

contract QuickswapLiquidityBridge is ILiquidity {

    address constant uniswapRouter = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;

    function addLiquidityETH(
        uint256 ethPercentage,
        uint256 minAmountEth,
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[] calldata minAmounts
    ) external override {

        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);
        uint256 amountToken = IERC20(tokens[0]).balanceOf(address(this)) * percentages[0] / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(tokens[0]).approve(uniswapRouter, 0);
        IERC20(tokens[0]).approve(uniswapRouter, amountToken);

        _uniswapRouter.addLiquidityETH{
            value : address(this).balance * ethPercentage / 100000}(
            tokens[0], //       address token,
            amountToken, //       uint amountTokenDesired,
            minAmounts[0], //        uint amountTokenMin,
            minAmountEth, //        uint amountETHMin,
            address(this), //  address to,
            block.timestamp + 100000  //   uint deadline
        );

        //emit AddLiquidityFromETH (ethAmount, assetIn, amountIn, assetOut, amountOut);
    }

    function addLiquidity(
        address[] calldata tokens,
        uint256[] calldata percentages,
        uint256[] calldata minAmounts
    ) external override {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);

        uint256 amountA = IERC20(tokens[0]).balanceOf(address(this)) * percentages[0] / 100000;
        uint256 amountB = IERC20(tokens[1]).balanceOf(address(this)) * percentages[1] / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(tokens[0]).approve(uniswapRouter, 0);
        IERC20(tokens[0]).approve(uniswapRouter, amountA);

        IERC20(tokens[1]).approve(uniswapRouter, 0);
        IERC20(tokens[1]).approve(uniswapRouter, amountB);

        _uniswapRouter.addLiquidity(
            tokens[0], //        address tokenA,
            tokens[1], //        address tokenB,
            amountA, //        uint amountADesired,
            amountB, //        uint amountBDesired,
            minAmounts[0], //        uint amountAMin,
            minAmounts[1], //        uint amountBMin,
            address(this), //  address to,
            block.timestamp + 100000  //   uint deadline
        );
    }
}
