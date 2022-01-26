// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

// Based on https://github.com/curvefi/curve-pool-registry/blob/master/contracts/AddressProvider.vy
interface ICurveAddressRegistry {

    function get_registry() external view returns (address);    

}