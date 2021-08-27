pragma solidity ^0.8.6;

interface IWalletFactory {
    function createWallet() external returns (address);
}
