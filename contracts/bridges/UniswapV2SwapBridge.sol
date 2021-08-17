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
            address(this),
            msg.value,
            path,
            amounts
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
        uint[] memory amounts = _uniswapRouter.swapExactTokensForETH(
            balance,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit TradedFromTokensToETH(
            address(this),
            balance,
            path,
            amounts
        );

    }

    function tradeFromTokensToTokens(
        address uniswapRouter,
        uint256 amountOutMin,
        address[] calldata path
    ) public payable {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);
        uint256 balance = IERC20(path[0]).balanceOf(address(this));

        IERC20(path[0]).approve(uniswapRouter, balance);
        uint[] memory amounts = _uniswapRouter.swapExactTokensForTokens(
            balance,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );

        emit TradedFromTokensToTokens(
            address(this),
            balance,
            path,
            amounts
        );

    }
}
