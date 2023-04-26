pragma solidity ^0.8.6;

import "./interfaces/ParaswapIntefaces.sol";
import "../interfaces/IParaswapBridge.sol";
import "hardhat/console.sol";

contract ParaswapBridge is IParaswapBridge {
    function simpleSwap(
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
            toAmount: 1,
            expectedAmount: 1,
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

    function multiSwap(
        address paraswapAddress,
        address approveAddress,
        bytes memory paraswapData,
        uint256 amountInPercentage
    ) external override {
        address token = bytes32ToAddress(readBytesFromPosition(paraswapData, 36));
        uint256 amount = IERC20(token).balanceOf(address(this)) * 25000 / 100000;
        IERC20(token).approve(approveAddress, amount);    

        console.log('this', address(this));

        console.log('a', bytes32ToAddress(readBytesFromPosition(paraswapData, 164)));

        // Modify paraswapParams in memory
        assembly {
            // Update fromAmount
            let dataPointer := add(paraswapData, 32) // Skip the length field of 'bytes' type
            mstore(add(dataPointer, 68), amount)
            // Update toAmount
            mstore(add(dataPointer, 100), 1)
            // Update expectedAmount
            mstore(add(dataPointer, 132), 1)
            // Update beneficiary
            mstore(add(dataPointer, 176), shl(96, address()))
        }         

        console.logBytes32(readBytesFromPosition(paraswapData, 68));

        console.log('b', bytes32ToAddress(readBytesFromPosition(paraswapData, 164)));  

        (bool isSuccess, bytes memory result) = paraswapAddress.call(paraswapData);
        if (!isSuccess) {
                assembly {
                    let ptr := mload(0x40)
                    let size := returndatasize()
                    returndatacopy(ptr, 0, size)
                    revert(ptr, size)
                }
            }        

        // emit DEFIBASKET_PARASWAP_SWAP(receivedAmount);
    }

    function readBytesFromPosition(bytes memory data, uint256 position) public pure returns (bytes32 result) {
        require(position + 32 <= data.length, "Position out of bounds");

        assembly {
            // Get a pointer to the data location
            let dataPointer := add(data, 32) // Skip the length field of 'bytes' type

            // Calculate the pointer to the starting position
            let startPointer := add(dataPointer, position)

            // Load 32 bytes from the start pointer
            result := mload(startPointer)
        }
    }

    function bytes32ToAddress(bytes32 b) public pure returns (address) {
        return address(uint160(uint256(b)));
    }
}