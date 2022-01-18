// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

// Based on https://github.com/beefyfinance/beefy-contracts/blob/master/contracts/BIFI/vaults/BeefyVaultV6.sol
interface IBeefyVaultV6 {

    function deposit(
        uint256 _amount    
    ) external;

    function withdraw(
        uint256 _shares
    ) external;

    function want() external view returns (address);

}