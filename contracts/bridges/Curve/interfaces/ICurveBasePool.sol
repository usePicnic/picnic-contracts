// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

// Based on https://github.com/curvefi/curve-contract/blob/master/contracts/pool-templates/y/SwapTemplateY.vy
interface ICurveBasePool {

    // Curve add_liquidity functions use static arrays, so we have different function selectors for each one of them
    function add_liquidity(uint256[2] calldata amounts, uint256 min_mint_amount) external returns (uint256);
    function add_liquidity(uint256[3] calldata amounts, uint256 min_mint_amount) external returns (uint256);
    function add_liquidity(uint256[4] calldata amounts, uint256 min_mint_amount) external returns (uint256);
    function add_liquidity(uint256[5] calldata amounts, uint256 min_mint_amount) external returns (uint256);
    function add_liquidity(uint256[6] calldata amounts, uint256 min_mint_amount) external returns (uint256);
    function add_liquidity(uint256[7] calldata amounts, uint256 min_mint_amount) external returns (uint256);
    function add_liquidity(uint256[8] calldata amounts, uint256 min_mint_amount) external returns (uint256);

    function add_liquidity(uint256[2] calldata amounts, uint256 min_mint_amount, bool use_underlying) external returns (uint256);
    function add_liquidity(uint256[3] calldata amounts, uint256 min_mint_amount, bool use_underlying) external returns (uint256);
    function add_liquidity(uint256[4] calldata amounts, uint256 min_mint_amount, bool use_underlying) external returns (uint256);
    function add_liquidity(uint256[5] calldata amounts, uint256 min_mint_amount, bool use_underlying) external returns (uint256);
    function add_liquidity(uint256[6] calldata amounts, uint256 min_mint_amount, bool use_underlying) external returns (uint256);
    function add_liquidity(uint256[7] calldata amounts, uint256 min_mint_amount, bool use_underlying) external returns (uint256);
    function add_liquidity(uint256[8] calldata amounts, uint256 min_mint_amount, bool use_underlying) external returns (uint256);      

    // Curve remove_liquidity functions use static arrays, so we have different function selectors for each one of them
    function remove_liquidity(uint256 _amount, uint256[2] calldata _min_amounts) external returns (uint256[2] memory);
    function remove_liquidity(uint256 _amount, uint256[3] calldata _min_amounts) external returns (uint256[3] memory);
    function remove_liquidity(uint256 _amount, uint256[4] calldata _min_amounts) external returns (uint256[4] memory);
    function remove_liquidity(uint256 _amount, uint256[5] calldata _min_amounts) external returns (uint256[5] memory);
    function remove_liquidity(uint256 _amount, uint256[6] calldata _min_amounts) external returns (uint256[6] memory);
    function remove_liquidity(uint256 _amount, uint256[7] calldata _min_amounts) external returns (uint256[7] memory);    
    function remove_liquidity(uint256 _amount, uint256[8] calldata _min_amounts) external returns (uint256[8] memory);

    function underlying_coins(uint256 i) external view returns (address);

    function lp_token() external view returns (address);   

}