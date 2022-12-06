// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

// Based on https://github.com/curvefi/curve-contract/blob/master/contracts/pool-templates/y/SwapTemplateY.vy
interface ICurveBasePool {

    // Curve add_liquidity functions use static arrays, so we have different function selectors for each one of them
    function add_liquidity(uint256[2] calldata amounts, uint256 min_mint_amount, bool use_eth) external returns (uint256);
    function add_liquidity(uint256[3] calldata amounts, uint256 min_mint_amount, bool use_eth) external returns (uint256);
    function add_liquidity(uint256[4] calldata amounts, uint256 min_mint_amount, bool use_eth) external returns (uint256);
    function add_liquidity(uint256[5] calldata amounts, uint256 min_mint_amount, bool use_eth) external returns (uint256);
    function add_liquidity(uint256[6] calldata amounts, uint256 min_mint_amount, bool use_eth) external returns (uint256);
    function add_liquidity(uint256[7] calldata amounts, uint256 min_mint_amount, bool use_eth) external returns (uint256);
    function add_liquidity(uint256[8] calldata amounts, uint256 min_mint_amount, bool use_eth) external returns (uint256);

    function remove_liquidity(uint256 _amount, uint256[2] calldata _min_amounts, bool use_eth) external;
    function remove_liquidity(uint256 _amount, uint256[3] calldata _min_amounts, bool use_eth) external;
    function remove_liquidity(uint256 _amount, uint256[4] calldata _min_amounts, bool use_eth) external;
    function remove_liquidity(uint256 _amount, uint256[5] calldata _min_amounts, bool use_eth) external;
    function remove_liquidity(uint256 _amount, uint256[6] calldata _min_amounts, bool use_eth) external;
    function remove_liquidity(uint256 _amount, uint256[7] calldata _min_amounts, bool use_eth) external;
    function remove_liquidity(uint256 _amount, uint256[8] calldata _min_amounts, bool use_eth) external;

    function remove_liquidity_one_coin(uint256 _token_amount, int128 i, uint256 _min_amount, bool use_eth) external returns (uint256);
}