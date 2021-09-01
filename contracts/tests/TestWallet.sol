pragma solidity ^0.8.6;

import "../Wallet.sol";

contract TestWallet is Wallet {

    function getIndexPool() public view returns (address) {
        return _owner;
    }

    // TODO: Echidna fuzzing tests

    // address echidna_caller = 0x00a329C0648769a73afAC7F9381e08fb43DBEA70;

    // constructor() Wallet() {
    //     _owner = echidna_caller;
    // }

    // function echidna_owner() public returns (bool) {
    //     if(_owner == echidna_caller) return true;
    // }
    
}