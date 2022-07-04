// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

// Based on https://github.com/curvefi/curve-pool-registry/blob/master/contracts/Registry.vy
interface ICurvePoolsRegistry {

    function get_n_coins(uint256 i) external view returns (uint256); // 0: coins, 1: underlying coins
    function get_coins(address _pool) external view returns (address[8] memory);
    function get_underlying_coins(address _pool) external view returns (address[8] memory);
    function get_gauges(address pool) external view returns (address[10] memory);

}