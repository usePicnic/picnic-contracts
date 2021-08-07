import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";
contract UniswapV2SwapBridge {
    function buy (
        address uniswapRouter,
        uint amountOutMin,
        address[] calldata path
    )
        public
        payable
    {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(uniswapRouter);

        _uniswapRouter.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            address(this),
            block.timestamp + 100000
        );
        console.log(msg.value);
    }
}