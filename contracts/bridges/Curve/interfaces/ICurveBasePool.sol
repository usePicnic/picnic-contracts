// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

// Based on https://github.com/curvefi/curve-contract/blob/master/contracts/pool-templates/y/SwapTemplateY.vy
interface ICurveBasePool {

    function add_liquidity(
        uint256[] calldata _amounts,
        uint256 _min_mint_amount        
    ) external returns (uint256);

    function remove_liquidity(
        uint256 _amount,
        uint256[] calldata _min_amouts
    ) external returns (uint256[] memory);

    function lp_token() external view returns (address);
    function reward_receiver() external view returns (address);

}