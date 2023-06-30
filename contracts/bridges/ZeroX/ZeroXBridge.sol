pragma solidity ^0.8.6;
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "./interfaces/ZeroXERC20.sol";

struct ZeroXParams {
    address fromToken;
    address toToken;
    uint256 amountInPercentage;
    uint256 minAmountOut;
    Transformation[] transformations;
}

contract ZeroXBridge {
    event DEFIBASKET_ZEROX_SWAP(uint256 receivedAmount);

    function swap(
        address zeroXaddress,
        address approveAddress,
        ZeroXParams calldata params        
    ) external {
        uint256 amount = IERC20(params.fromToken).balanceOf(address(this))*params.amountInPercentage/100000;
        IERC20(params.fromToken).approve(approveAddress, amount);

        ZeroXERC20 zerox = ZeroXERC20(zeroXaddress);

        uint256 receivedAmount = zerox.transformERC20(
            params.fromToken,
            params.toToken,
            amount,
            params.minAmountOut,
            params.transformations
        );

        emit DEFIBASKET_ZEROX_SWAP(receivedAmount);
    }
}