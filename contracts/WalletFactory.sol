pragma solidity ^0.8.6;

import "./Wallet.sol";
import "./interfaces/IWalletFactory.sol";

contract WalletFactory is IWalletFactory {
    function createWallet() external override returns (address){
        Wallet wallet = new Wallet(msg.sender);
        return address(wallet);
    }
}

