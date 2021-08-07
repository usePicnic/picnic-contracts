pragma solidity 0.6.12;

pragma experimental ABIEncoderV2;
import "hardhat/console.sol";

import "./interfaces/IWallet.sol";

contract Wallet is IWallet {
    // constructor() {
    //     // uint256 _nftId = nftId;
    // }

    modifier _ownerOnly_() {
        require(
            true, // TODO : obvious
            "ONLY WALLET OWNER CAN CALL THIS FUNCTION"
        );
        _;
    }

    event Received(address sender, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function deposit(
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external payable override _ownerOnly_ {
        // IBridge bridge;
        // uint256[] output;
        // console.log("wallet address:");
        // console.log(address(this));
        console.log("wallet:",address(this));
        for (uint8 i = 0; i < _bridgeAddresses.length; i++) {
            // bridge = IBridge(_bridgeAddresses[i]);
            // Bridge 1 -> Swap
                // Deposit MATIC -> DAI
                // Who owns DAI? DAI -> Wallet?
            // Bridge 2 -> Aave Deposit
                // Deposit DAI on AAVE
                // Wallet -> Bridge -> Aave?
                // Bridge -> Aave?
                // Transfer from wallet to Aave?

            // Wallet -> new Bridge
            // output = bridge{value: msg.value}(_bridgeEncodedCalls[i], output); // TODO needs to be payable           
            bool isSuccess;
            // bytes memory returnData;

            console.log("bridgeaddress:",_bridgeAddresses[i]);
            (isSuccess, ) = _bridgeAddresses[i].call(_bridgeEncodedCalls[i]);
            require(
                isSuccess == true,
                "BRIDGE CALL MUST BE SUCCESSFUL"
            );
            // buy (
            // uint amountOutMin,
            // address[] calldata path,
            // address to,
            // uint deadline
            // )
        }
    }

    function withdraw(
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external override _ownerOnly_ {
        for (uint8 i = 0; i < _bridgeAddresses.length; i++) {
            bool isSuccess;

            (isSuccess, ) = _bridgeAddresses[i].delegatecall(_bridgeEncodedCalls[i]);
            require(
                isSuccess == true,
                "BRIDGE CALL MUST BE SUCCESSFUL"
            );
        }
    }

    function viewEthHoldings (
        address[] calldata _bridgeAddresses,
        bytes[] calldata _bridgeEncodedCalls
    ) external override _ownerOnly_ {
        
    }
}
