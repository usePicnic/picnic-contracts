pragma solidity ^0.8.6;
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "./interfaces/ZeroXERC20.sol";


contract ZeroXBridge {
    event DEFIBASKET_ZEROX_SWAP(uint256 receivedAmount);

    function swap(
        address zeroXaddress,
        address fromToken,
        address toToken,
        uint256 amountInPercentage,
        uint256 minAmountOut,
        Transformation[] memory transformations
    ) external {
        uint256 amount = IERC20(fromToken).balanceOf(address(this))*amountInPercentage/100000;
        IERC20(fromToken).approve(zeroXaddress, amount);

        ZeroXERC20 zerox = ZeroXERC20(zeroXaddress);

        uint256 receivedAmount = zerox.transformERC20(
            fromToken,
            toToken,
            amount,
            minAmountOut,
            transformations
        );

        emit DEFIBASKET_ZEROX_SWAP(receivedAmount);
    }
}