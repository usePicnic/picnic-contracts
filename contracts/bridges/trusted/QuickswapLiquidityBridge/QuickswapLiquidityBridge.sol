pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "hardhat/console.sol";

// TODO this bridge is work in progress

contract QuickswapLiquidityBridge {

    address constant uniswapRouter = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;

    function addLiquidityETH(
        address token,
        uint256 tokenPercentage,
        uint256 ethPercentage,
        uint256 minAmountToken,
        uint256 minAmountEth
    ) external {

        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);
        uint256 amountToken = IERC20(token).balanceOf(address(this)) * tokenPercentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(token).approve(uniswapRouter, 0);
        IERC20(token).approve(uniswapRouter, amountToken);

        _uniswapRouter.addLiquidityETH{
            value : address(this).balance * ethPercentage / 100000}(
            token, //       address token,
            IERC20(token).balanceOf(address(this)) * tokenPercentage / 100000, //       uint amountTokenDesired,
            minAmountToken, //        uint amountTokenMin,
            minAmountEth, //        uint amountETHMin,
            address(this), //  address to,
            block.timestamp + 100000  //   uint deadline
        );
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 tokenAPercentage,
        uint256 tokenBPercentage,
        uint256 minAmountA,
        uint256 minAmountB
    ) external {

        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);

        uint256 amountA = IERC20(tokenA).balanceOf(address(this)) * tokenAPercentage / 100000;
        uint256 amountB = IERC20(tokenB).balanceOf(address(this)) * tokenBPercentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(tokenA).approve(uniswapRouter, 0);
        IERC20(tokenA).approve(uniswapRouter, amountA);

        IERC20(tokenB).approve(uniswapRouter, 0);
        IERC20(tokenB).approve(uniswapRouter, amountB);

        _uniswapRouter.addLiquidity(
            tokenA, //        address tokenA,
            tokenB, //        address tokenB,
            amountA, //        uint amountADesired,
            amountB, //        uint amountBDesired,
            minAmountA, //        uint amountAMin,
            minAmountB, //        uint amountBMin,
            address(this), //  address to,
            block.timestamp + 100000  //   uint deadline
        );
    }
}
