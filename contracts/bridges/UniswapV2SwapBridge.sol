import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

import "hardhat/console.sol";

contract UniswapV2SwapBridge {
    function tradeFromETHtoTokens(
        address uniswapRouter,
        uint256 amountOutMin,
        address[] calldata path
    ) public payable {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);

        _uniswapRouter.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );
        console.log(msg.value);
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
    }
}
