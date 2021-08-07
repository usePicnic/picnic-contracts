import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";
contract UniswapV2SwapBridge {
    IUniswapV2Router02 private _uniswapRouter;
    constructor(address uniswapRouter) {
        _uniswapRouter = IUniswapV2Router02(uniswapRouter);
        console.log("uniswap router (in contract):",address(_uniswapRouter));
    }
   
    function buy (
        uint amountOutMin,
        address[] calldata path
    )
        public
        payable
    {
        console.log("uniswapv2swapbridge (inside uniswapv2swapbridge):",address(this));
        console.log("uniswap router (inside uniswapv2swapbridge):", address(_uniswapRouter));
        // console.log(path[0]);
        // console.log(path[1]);
        // console.log(amountOutMin);
        // console.log(msg.sender);
        // console.log(msg.value);
        // console.log(block.timestamp);

        _uniswapRouter.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            msg.sender,
            block.timestamp + 100000
        );
        console.log(msg.value);
    }
}