pragma solidity 0.6.12;

pragma experimental ABIEncoderV2;

interface IWallet {

    function deposit(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external payable;

    function withdraw(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external;

    function viewEthHoldings (address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external;
}
