pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "hardhat/console.sol";

contract UniswapV2SwapBridge {
    event TradedFromETHToTokens(
        address[] path,
        uint256[] amounts
    );

    event TradedFromTokensToETH(
        address[] path,
        uint256[] amounts
    );

    event TradedFromTokensToTokens(
        address[] path,
        uint256[] amounts
    );

    function tradeFromETHToTokens(
        address uniswapRouter,
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) public {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);

        uint256 amountIn = address(this).balance * amountInPercentage / 100000;

        // TODO what happens if approve amountIn > balance?
        uint[] memory amounts = _uniswapRouter.swapExactETHForTokens{value: amountIn}(
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit TradedFromETHToTokens(
            path,
            amounts
        );
    }

    function tradeFromTokensToETH(
        address uniswapRouter,
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) public {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);

        // TODO what happens if approve value > balance? (what tokens can break this? should use safeerc20?)
        // TODO can't go over 100%

        uint256 amountIn = IERC20(path[0]).balanceOf(address(this)) * amountInPercentage / 100000;
        IERC20(path[0]).approve(uniswapRouter, amountIn);

        uint[] memory amounts = _uniswapRouter.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit TradedFromTokensToETH(
            path,
            amounts
        );

    }

    function tradeFromTokensToTokens(
        address uniswapRouter,
        uint256 amountInPercentage,
        uint256 amountOutMin,
        address[] calldata path
    ) public {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);

        uint256 amountIn = IERC20(path[0]).balanceOf(address(this)) * amountInPercentage / 100000;
        IERC20(path[0]).approve(uniswapRouter, amountIn);
        // TODO what happens if approve value > balance? (what tokens can break this? should use safeerc20?)
        IERC20(path[0]).approve(uniswapRouter, amountIn);
        uint[] memory amounts = _uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit TradedFromTokensToTokens(
            path,
            amounts
        );

    }
}
