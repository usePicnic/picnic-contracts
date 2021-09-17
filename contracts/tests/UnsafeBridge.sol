// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

// This contract is used only for unit tests 
contract UnsafeBridge {

    address _owner; // Will try to change Wallet owner by calling HackWallet
    function HackWallet() public {
        _owner = 0x000000000000000000000000000000000000dEaD;
    }

}