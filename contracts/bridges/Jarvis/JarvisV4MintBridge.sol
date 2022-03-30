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
      * @dev Wraps the Aave deposit and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param assetIn Address of the asset to be deposited into the Aave protocol
      * @param percentageIn Percentage of the balance of the asset that will be deposited
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

        (uint256 amountOut, ) = jarvis.mint(mintParams);

        emit DEFIBASKET_JARVISV4_MINT(amount, amountOut);
    }

//    /**
//      * @notice Withdraws from the Aave protocol.
//      *
//      * @dev Wraps the Aave withdrawal and generates the necessary events to communicate with DeFi Basket's UI and back-end.
//      * To perform a harvest invoke withdraw with percentageOut set to 0.
//      *
//      * @param assetOut Address of the asset to be withdrawn from the Aave protocol
//      * @param percentageOut Percentage of the balance of the asset that will be withdrawn
//      */
//    function withdraw(address assetOut, uint256 percentageOut) external override {
//        IAaveIncentivesController distributor = IAaveIncentivesController(incentivesControllerAddress);
//        ILendingPool _aaveLendingPool = ILendingPool(aaveLendingPoolAddress);
//
//        address assetIn = _aaveLendingPool.getReserveData(assetOut).aTokenAddress;
//        uint256 amount = 0;
//
//        if (percentageOut > 0) {
//            amount = IERC20(assetIn).balanceOf(address(this)) * percentageOut / 100000;
//            _aaveLendingPool.withdraw(assetOut, amount, address(this));
//        }
//
//        address[] memory assets = new address[](1);
//        assets[0] = assetIn;
//
//        uint256 amountToClaim = distributor.getRewardsBalance(assets, address(this));
//        uint256 claimedReward = distributor.claimRewards(assets, amountToClaim, address(this));
//        address claimedAsset = distributor.REWARD_TOKEN();
//
//        emit DEFIBASKET_AAVEV2_WITHDRAW(assetIn, amount, claimedAsset, claimedReward);
//    }
}
