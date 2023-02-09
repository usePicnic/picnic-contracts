pragma solidity ^0.8.6;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "hardhat/console.sol";

interface IAggregationExecutor {
    /// @notice propagates information about original msg.sender and executes arbitrary data
    function execute(address msgSender) external payable;  // 0x4b64e492
}

interface OneInchInterface {
    /// @notice propagates information about original msg.sender and executes arbitrary data
     function swap(
            IAggregationExecutor executor,
            SwapDescription calldata desc,
            bytes calldata permit,
            bytes calldata data
        )
        external
        payable
        returns (
            uint256 returnAmount,
            uint256 spentAmount
        );  
}
struct SwapDescription {
        IERC20 srcToken;
        IERC20 dstToken;
        address payable srcReceiver;
        address payable dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }

contract OneInchBridge {        
    function swap(
            address oneInchAddress,
            uint256 minReturnAmount,
            IAggregationExecutor executor,
            SwapDescription calldata desc,
            bytes calldata permit,
            bytes calldata data
        )
        external
        {
            uint256 amount = desc.srcToken.balanceOf(address(this));
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
            oneInch.swap(
                executor,
                updatedDescription,
                permit,
                data
            );
        }
    }