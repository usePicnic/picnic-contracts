pragma solidity ^0.8.6;

pragma experimental ABIEncoderV2;
import "hardhat/console.sol";

import "./interfaces/IWallet.sol";

contract Wallet is IWallet {
    address creator;
    modifier _ownerOnly_() {
        require(
            creator==msg.sender,
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
        for (uint16 i = 0; i < _bridgeAddresses.length; i++) {
            bool isSuccess;

            (isSuccess, ) = _bridgeAddresses[i].delegatecall(_bridgeEncodedCalls[i]);
            require(
                isSuccess == true,
                "WALLET: BRIDGE CALL MUST BE SUCCESSFUL"
            );
        }
    }

    function read (
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external view override _ownerOnly_ {
    }
}
