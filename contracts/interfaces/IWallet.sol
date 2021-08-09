pragma solidity ^0.8.6;

pragma experimental ABIEncoderV2;

interface IWallet {
    function write(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external payable;
    function read (address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external view;
}
