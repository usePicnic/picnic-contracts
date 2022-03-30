// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ISynthereumPoolOnChainPriceFeed.sol";
import "../interfaces/IJarvisV4Mint.sol";

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

contract JarvisV4MintBridge is IJarvisV4Mint {

    ISynthereumPoolOnChainPriceFeed constant jarvis = ISynthereumPoolOnChainPriceFeed(0x6cA82a7E54053B102e7eC452788cC19204e831de);

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
    function mint(address assetIn, uint256 percentageIn, address assetOut, uint256 minAmountOut) external override {
        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(address(jarvis), 0);
        IERC20(assetIn).approve(address(jarvis), amount);


        uint256 feePercentage = 2000000000000000;

        ISynthereumPoolOnChainPriceFeed.MintParams memory mintParams = ISynthereumPoolOnChainPriceFeed.MintParams(
            assetOut, // Derivative to use
            minAmountOut, // Minimum amount of synthetic tokens that a user wants to mint using collateral (anti-slippage)
            amount, // Amount of collateral that a user wants to spend for minting
            feePercentage, // Maximum amount of fees in percentage that user is willing to pay
            block.timestamp + 10000, // Expiration time of the transaction
            address(this) // Address to which send synthetic tokens minted
        );

        (uint256 amountOut,) = jarvis.mint(mintParams);

        emit DEFIBASKET_JARVISV4_MINT(amount, amountOut);
    }
    /**
      * @notice Redeems USDC using Jarvis from jTokens.
      *
      * @dev Interacts with SynthereumPoolOnChainPriceFeed to redeem jTokens into USDC
      *
      * @param assetIn Address of the jToken
      * @param derivativeAddress Derivative address for jToken
      * @param percentageIn Percentage of the balance of the jToken that will be converted
      * @param assetOut Address of collateral (USDC)
      * @param minAmountOut Minimum amount of collateral out (reduces slippage)
      */
    function redeem(
        address assetIn,
        address derivativeAddress,
        uint256 percentageIn,
        address assetOut,
        uint256 minAmountOut
    ) external override {

        uint256 amount = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(address(jarvis), 0);
        IERC20(assetIn).approve(address(jarvis), amount);

        uint256 feePercentage = 2000000000000000;

        ISynthereumPoolOnChainPriceFeed.RedeemParams memory redeemParams = ISynthereumPoolOnChainPriceFeed.RedeemParams(
            derivativeAddress, // Derivative to use
            amount, // Amount of synthetic tokens that user wants to use for redeeming
            minAmountOut, // Minimium amount of collateral that user wants to redeem (anti-slippage)
            feePercentage, // Maximum amount of fees in percentage that user is willing to pay
            block.timestamp + 10000, // Expiration time of the transaction
            address(this) // Address to which send collateral tokens redeemed
        );

        (uint256 amountOut,) = jarvis.redeem(redeemParams);

        emit DEFIBASKET_JARVISV4_REDEEM(amount, amountOut);
    }
}
