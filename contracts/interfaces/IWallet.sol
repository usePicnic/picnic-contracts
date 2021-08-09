pragma solidity 0.6.12;

pragma experimental ABIEncoderV2;

interface IWallet {
    function payableCall(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external payable;
    function writeCall(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external;
    function readCall(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external view;
}
