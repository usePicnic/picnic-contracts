pragma solidity ^0.8.6;

pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IWallet.sol";

contract Wallet is IWallet {
    address creator;
    modifier _ownerOnly_() {
        require(
            creator == msg.sender,
            "WALLET: ONLY WALLET OWNER CAN CALL THIS FUNCTION"
        );
        _;
    }

    event Received(address sender, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    constructor() {
        creator = msg.sender;
    }

    function write(
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external override payable _ownerOnly_ {
        bool isSuccess;
        bytes memory result;

        for (uint16 i = 0; i < _bridgeAddresses.length; i++) {
            (isSuccess, result) = _bridgeAddresses[i].delegatecall(_bridgeEncodedCalls[i]);
            // TODO should we keep using assembly?
            if (isSuccess == false) {
                assembly {
                    let ptr := mload(0x40)
                    let size := returndatasize()
                    returndatacopy(ptr, 0, size)
                    revert(ptr, size)
                }
            }
        }
    }

    function withdraw(
        address[] calldata outputTokens,
        uint256[] calldata outputPercentages,
        uint256 outputEthPercentage,
        address user) external override _ownerOnly_ returns (uint256[] memory, uint256){
        uint256 outputAmount;
        {
            uint256[] memory outputTokenAmounts = new uint256[](outputTokens.length);
            for (uint16 i = 0; i < outputTokens.length; i++) {
                outputTokenAmounts[i] = IERC20(outputTokens[i]).balanceOf(address(this)) * outputPercentages[i] / 100000;
                IERC20(outputTokens[i]).transfer(user, outputAmount);
            }
            uint256 outputEthAmount;
            if (outputEthPercentage > 0) {
                outputEthAmount = address(this).balance * outputEthPercentage / 100000;
                payable(user).transfer(outputAmount);
            }

            return (outputTokenAmounts, outputEthAmount);
        }
    }

    // TODO should we have a read function? or should we read all data we need from events?
    function read(
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external view override _ownerOnly_ {
    }
}
