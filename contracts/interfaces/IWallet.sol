// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;
import "../libraries/DBDataTypes.sol";

interface IWallet {
    function useBridges(address[] calldata _bridgeAddresses, bytes[] calldata _bridgeEncodedCalls) external;

    function withdraw(
        DBDataTypes.TokenData calldata outputs,
        uint256 outputEthPercentage,
        address user) external returns (uint256[] memory, uint256);
}
