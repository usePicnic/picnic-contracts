pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

struct SimpleData {
    address fromToken;
    address toToken;
    uint256 fromAmount;
    uint256 toAmount;
    uint256 expectedAmount;
    address[] callees;
    bytes exchangeData;
    uint256[] startIndexes;
    uint256[] values;
    address payable beneficiary;
    address payable partner;
    uint256 feePercent;
    bytes permit;
    uint256 deadline;
    bytes16 uuid;
}

interface IAggregationExecutor {
    /// @notice propagates information about original msg.sender and executes arbitrary data
    function execute(address msgSender) external payable; // 0x4b64e492
}

interface ParaswapInterface{
    function simpleSwap(
        IAggregationExecutor executor,
        SimpleData calldata data
    ) external returns (uint256 receivedAmount);
}

interface IParaswapBridge{
    event DEFIBASKET_PARASWAP_SWAP(uint256 receivedAmount);

    function swap(
        address paraswapAddress,
        IAggregationExecutor executor,
        SimpleData calldata paraswapParams,
        uint256 amountInPercentage
    ) external;
}



contract ParaswapBridge is IParaswapBridge {
    function swap(
        address paraswapAddress,
        IAggregationExecutor executor,
        SimpleData calldata paraswapParams,
        uint256 amountInPercentage
    ) external override {
        uint256 amount = IERC20(paraswapParams.fromToken).balanceOf(address(this))*amountInPercentage/100000;
        IERC20(paraswapParams.fromToken).approve(paraswapAddress, amount);

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
            executor,
            updatedDescription
        );

        emit DEFIBASKET_PARASWAP_SWAP(receivedAmount);
    }
}