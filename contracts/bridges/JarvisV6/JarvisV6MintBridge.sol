// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ISynthereumV2.sol";
import "../interfaces/IJarvisV6Mint.sol";
import "hardhat/console.sol";
/**
 * @title JarvisV4DepositBridge
 * @author DeFi Basket
 *
 * @notice Mints and redeems jTokens using Jarvis Price feed.
 *
 * @dev This contract has 2 main functions:
 *
 * 1. Mint jTokens from Jarvis
 * 2. Redeem jTokens from Jarvis
 *
 */
/// @custom:security-contact hi@defibasket.org
contract JarvisV6MintBridge is IJarvisV6Mint {
    /**
      * @notice Mints jTokens using Jarvis from USDC.
      *
      * @dev Interacts with SynthereumPoolOnChainPriceFeed to mint jTokens
      *
      * @param assetIn Address of the asset to be converted to jTokens (USDC only)
      * @param percentageIn Percentage of the balance of the asset that will be converted
      * @param assetOut Derivative address for jToken
      * @param minAmountOut Minimum amount of jTokens out (reduces slippage)
      */
    function mint(
        address synthereumAddress,
        address assetIn,
        uint256 percentageIn,
        address assetOut,
        uint256 minAmountOut
    ) external override {
        ISynthereumV2 jarvis = ISynthereumV2(synthereumAddress);

        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(address(jarvis), 0);
        IERC20(assetIn).approve(address(jarvis), amount);

        ISynthereumV2.MintParams memory mintParams = ISynthereumV2.MintParams(
        minAmountOut, // uint256 minNumTokens;
        amount, // uint256 collateralAmount;
        block.timestamp + 100000, // uint256 expiration;
        address(this) // address recipient;
        );

        (uint256 amountOut,) = jarvis.mint(mintParams);

        emit DEFIBASKET_JARVISV6_MINT(amount, amountOut);
    }
    /**
      * @notice Redeems USDC using Jarvis from jTokens.
      *
      * @dev Interacts with SynthereumPoolOnChainPriceFeed to redeem jTokens into USDC
      *
      * @param assetIn Address of the jToken
      * @param percentageIn Percentage of the balance of the jToken that will be converted
      * @param assetOut Address of collateral (USDC)
      * @param minAmountOut Minimum amount of collateral out (reduces slippage)
      */
    function redeem(
        address synthereumAddress,
        address assetIn,
        uint256 percentageIn,
        address assetOut,
        uint256 minAmountOut
    ) external override {
        ISynthereumV2 jarvis = ISynthereumV2(synthereumAddress);

        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(address(jarvis), 0);
        IERC20(assetIn).approve(address(jarvis), amount);

        ISynthereumV2.RedeemParams memory redeemParams = ISynthereumV2.RedeemParams(
            amount, // Amount of synthetic tokens that user wants to use for redeeming
            minAmountOut, // Minimium amount of collateral that user wants to redeem (anti-slippage)
            block.timestamp + 100000, // Expiration time of the transaction
            address(this) // Address to which send collateral tokens redeemed
        );

        (uint256 amountOut,) = jarvis.redeem(redeemParams);

        emit DEFIBASKET_JARVISV6_REDEEM(amount, amountOut);
    }
}
