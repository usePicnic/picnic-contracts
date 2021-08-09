import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

import "hardhat/console.sol";

contract UniswapV2SwapBridge {
    event TradedFromETHToTokens(
        // address wallet,
        // address[] token,
        // uint fromETH,
        // uint[] toTokens
    );

    event TradedFromTokensToETH(
        // address wallet,
        // address token,
        // uint fromTokens,
        // uint toETH
    );

    function tradeFromETHToTokens(
        address uniswapRouter,
        uint256 amountOutMin,
        address[] calldata path
    ) public payable {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);

        uint[] memory amounts = _uniswapRouter.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit TradedFromETHToTokens(
            // address(this),
            // path[path.length-1],
            // msg.value,
            // amounts[amounts.length-1]
        );
    }

    function tradeFromTokensToETH(
        address uniswapRouter,
        uint256 amountOutMin,
        address[] calldata path
    ) public payable {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);
        uint256 balance = IERC20(path[0]).balanceOf(address(this));

        IERC20(path[0]).approve(uniswapRouter, balance);
        _uniswapRouter.swapExactTokensForETH(
            balance,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit TradedFromTokensToETH(
            // address(this),
            // path[path.length-1],
            // msg.value,
            // amounts[amounts.length-1]
        );

    }
}
