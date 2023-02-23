pragma solidity ^0.8.6;

import "./interfaces/OneInchInterfaces.sol";
import "../interfaces/IOneInchBridge.sol";

contract OneInchBridge is IOneInchBridge {
    function swap(
        address oneInchAddress,
        uint256 minReturnAmount,
        uint256 amountInPercentage,
        IAggregationExecutor executor,
        SwapDescription calldata desc,
        bytes calldata permit,
        bytes calldata data
    ) external override {
        uint256 amount = desc.srcToken.balanceOf(address(this)) * amountInPercentage / 100000;
        desc.srcToken.approve(oneInchAddress, amount);

        SwapDescription memory updatedDescription = SwapDescription({
            srcToken: desc.srcToken,
            dstToken: desc.dstToken,
            srcReceiver: desc.srcReceiver,
            dstReceiver: payable(address(this)),
            amount: amount,
            minReturnAmount: minReturnAmount, // This needs to be improved eventually
            flags: desc.flags
        });

        OneInchInterface oneInch = OneInchInterface(oneInchAddress);

        (uint256 returnAmount, uint256 spentAmount) = oneInch.swap(
            executor,
            updatedDescription,
            permit,
            data
        );

        emit DEFIBASKET_ONEINCH_SWAP(spentAmount, returnAmount);
    }
}
