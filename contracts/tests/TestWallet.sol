pragma solidity ^0.8.6;

import "../Wallet.sol";

// This contract is used only for unit and Echidna tests 
contract TestWallet is Wallet {

    function getIndexPool() public view returns (address) {
        return _indexpoolAddress;
    }
   
}