pragma solidity ^0.8.6;
import "../libraries/IPDataTypes.sol";

interface IWallet {
    event INDEXPOOL_BRIDGE_CALL();

    function useBridges(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external;

    function withdraw(
        IPDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address user) external returns (uint256[] memory, uint256);
}
