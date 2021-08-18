pragma solidity 0.8.6;
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

contract WithdrawBridge {
    function withdrawETH(uint256 amountOut) public {
        require(amountOut<=address(this).balance, 'NOT ENOUGH ETH BALANCE');
        payable(msg.sender).transfer(amountOut);
    }

    function withdrawERC20(address tokenAddress, uint256 amountOut) public {
        // TODO is approve really necessary?
        // TODO why approve inside a require? safeERC20-ish trick?
        require(
            IERC20(tokenAddress).approve(msg.sender, amountOut),
            "ERC20 APPROVE FAILED"
        );
        IERC20(tokenAddress).transfer(msg.sender, amountOut);
    }
}
