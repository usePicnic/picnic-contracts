pragma solidity ^0.8.6;

import "./Wallet.sol";

contract WalletFactory {
    function createWallet() external returns (address){
        Wallet wallet = new Wallet(msg.sender);
        return address(wallet);
    }
}

