pragma solidity 0.6.12;

pragma experimental ABIEncoderV2;
import "hardhat/console.sol";

import "./interfaces/IWallet.sol";

contract Wallet is IWallet {
    modifier _ownerOnly_() {
        require(
            true, // TODO : NFT owner needs to check
            "ONLY WALLET OWNER CAN CALL THIS FUNCTION"
        );
        _;
    }

    event Received(address sender, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function write(
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external override _ownerOnly_ {
        for (uint16 i = 0; i < _bridgeAddresses.length; i++) {
            bool isSuccess;

            (isSuccess, ) = _bridgeAddresses[i].delegatecall(_bridgeEncodedCalls[i]);
            require(
                isSuccess == true,
                "BRIDGE CALL MUST BE SUCCESSFUL"
            );
        }
    }

    function read (
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external view override _ownerOnly_ {
    }
}
