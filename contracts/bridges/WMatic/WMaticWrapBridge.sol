// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IWMatic.sol";
import "../interfaces/IWMaticWrap.sol";

/**
 * @title QuickswapSwapBridge
 * @author DeFi Basket
 *
 * @notice Swaps using the Quickswap contract in Polygon.
 *
 * @dev This contract swaps ERC20 tokens to ERC20 tokens. Please notice that there are no payable functions.
 *
 */
/// @custom:security-contact hi@defibasket.org
contract WMaticWrapBridge is IWMaticWrap {
    address constant wMaticAddress = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
    IWMatic constant wmatic = IWMatic(wMaticAddress);

    /**
      * @notice Wraps MATIC to WMATIC
      *
      * @dev Wraps MATIC into WMATIC using the WMATIC contract.
      *
      * @param percentageIn Percentage of MATIC to be wrapped into WMATIC
      */
    function wrap(uint256 percentageIn) external override {
        emit DEFIBASKET_WMATIC_WRAP(address(this).balance * percentageIn / 100000);
        wmatic.deposit{value : address(this).balance * percentageIn / 100000}();
    }

    /**
      * @notice Unwraps WMATIC to MATIC
      *
      * @dev Unwraps WMATIC into MATIC using the WMATIC contract.
      *
      * @param percentageOut Percentage of WMATIC to be unwrapped into MATIC
      */
    function unwrap(uint256 percentageOut) external override {
        emit DEFIBASKET_WMATIC_UNWRAP(IERC20(wMaticAddress).balanceOf(address(this)) * percentageOut / 100000);
        wmatic.withdraw(IERC20(wMaticAddress).balanceOf(address(this)) * percentageOut / 100000);
    }
}
