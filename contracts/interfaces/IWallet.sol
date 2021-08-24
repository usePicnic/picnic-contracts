pragma solidity ^0.8.6;
import "../libraries/IPDataTypes.sol";

interface IWallet {
    function write(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) payable external;

    function withdraw(
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address user) external returns (uint256[] memory, uint256);
}
