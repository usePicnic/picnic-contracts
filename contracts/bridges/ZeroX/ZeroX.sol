pragma solidity ^0.8.6;
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

struct Transformation {
        // The deployment nonce for the transformer.
        // The address of the transformer contract will be derived from this
        // value.
        uint32 deploymentNonce;
        // Arbitrary data to pass to the transformer.
        bytes data;
    }

interface ZeroX {
      function transformERC20(
        address inputToken,
        address outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] memory transformations
    ) external payable returns (uint256 outputTokenAmount);
}

contract ZeroXBridge {
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

        ZeroX zerox = ZeroX(zeroXaddress);

        uint256 receivedAmount = zerox.transformERC20(
            fromToken,
            toToken,
            amount,
            minAmountOut,
            transformations
        );

        // emit DEFIBASKET_ZEROX_SWAP(receivedAmount);
    }
}