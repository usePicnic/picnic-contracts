pragma solidity ^0.8.6;
import "../libraries/IPDataTypes.sol";

pragma experimental ABIEncoderV2; // TODO is this necessary?

interface IWallet {
    function write(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external;

    function withdraw(
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address user) external returns (uint256[] memory, uint256);
}
