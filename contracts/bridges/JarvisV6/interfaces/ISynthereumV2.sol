// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface ISynthereumV2{
    struct MintParams {
        // Minimum amount of synthetic tokens that a user wants to mint using collateral (anti-slippage)
        uint256 minNumTokens;
        // Amount of collateral that a user wants to spend for minting
        uint256 collateralAmount;
        // Expiration time of the transaction
        uint256 expiration;
        // Address to which send synthetic tokens minted
        address recipient;
    }

    struct RedeemParams {
        // Amount of synthetic tokens that user wants to use for redeeming
        uint256 numTokens;
        // Minimium amount of collateral that user wants to redeem (anti-slippage)
        uint256 minCollateral;
        // Expiration time of the transaction
        uint256 expiration;
        // Address to which send collateral tokens redeemed
        address recipient;
    }

    function mint(MintParams memory mintParams)
        external
    returns (uint256 syntheticTokensMinted, uint256 feePaid);

    function redeem(RedeemParams memory redeemParams)
        external
    returns (uint256 collateralRedeemed, uint256 feePaid);


}


