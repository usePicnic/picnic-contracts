pragma solidity ^0.8.6;

import "./interfaces/ParaswapIntefaces.sol";
import "../interfaces/IParaswapBridge.sol";

contract ParaswapBridge is IParaswapBridge {
    function swap(
        address paraswapAddress,
        address approveAddress,
        SimpleData calldata paraswapParams,
        uint256 amountInPercentage
    ) external override {
        uint256 amount = IERC20(paraswapParams.fromToken).balanceOf(address(this))*amountInPercentage/100000;
        IERC20(paraswapParams.fromToken).approve(approveAddress, amount);

        SimpleData memory updatedDescription = SimpleData({
            fromToken: paraswapParams.fromToken,
            toToken: paraswapParams.toToken,
            fromAmount: amount,
            toAmount: paraswapParams.toAmount,
            expectedAmount: paraswapParams.expectedAmount,
            callees: paraswapParams.callees,
            exchangeData: paraswapParams.exchangeData,
            startIndexes: paraswapParams.startIndexes,
            values: paraswapParams.values,
            beneficiary: payable(address(this)),
            partner: paraswapParams.partner,
            feePercent: paraswapParams.feePercent,
            permit: paraswapParams.permit,
            deadline: paraswapParams.deadline,
            uuid: paraswapParams.uuid
        });

        ParaswapInterface paraswap = ParaswapInterface(paraswapAddress);

        uint256 receivedAmount = paraswap.simpleSwap(
            updatedDescription
        );

        emit DEFIBASKET_PARASWAP_SWAP(receivedAmount);
    }
}