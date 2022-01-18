// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IBeefyVaultV6.sol";
import "../interfaces/IBeefyDeposit.sol";

/**
 * @title BeefyDepositBridge
 * @author DeFi Basket
 *
 * @notice Deposits and withdraws from Beefy vaults in Polygon.
 *
 * @dev This contract has 2 main functions:
 *
 * 1. Deposit in Beefy vault
 * 2. Withdraw from Beefy vault 
 *
 */

contract BeefyDepositBridge is IBeefyDeposit {

    /**
      * @notice Deposits into a Beefy vault 
      *
      * @dev Wraps Beefy's vault deposit function and generates an event to communicate with DeFi Basket's UI and back-end.
      *
      * @param vaultAddress The address of the Beefy vault.
      * @param percentageIn Percentage of the balance of the asset that will be deposited
      */
    function deposit(address vaultAddress, uint256 percentageIn) external override {
        
        IBeefyVaultV6 vault = IBeefyVaultV6(vaultAddress);
        IERC20 mooToken = IERC20(vaultAddress);

        IERC20 assetIn = IERC20(vault.want());        
        uint256 amountIn = assetIn.balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        assetIn.approve(vaultAddress, 0);
        assetIn.approve(vaultAddress, amountIn);

        // Compute balance of mooToken before deposit
        uint256 mooTokenBalanceBefore = mooToken.balanceOf(address(this));

        vault.deposit(amountIn);
        uint256 mooTokenReceived = mooToken.balanceOf(address(this)) - mooTokenBalanceBefore;

        emit DEFIBASKET_BEEFY_DEPOSIT(amountIn, mooTokenReceived);
    }

    /**
      * @notice Withdraws from the Beefy vault.
      *
      * @dev Wraps the Beefy's vault withdraw function and generates an event to communicate with DeFi Basket's UI and back-end.
      *
      * @param vaultAddress The address of the Beefy vault.
      * @param percentageOut Percentage of mooToken that will be burned
      *
      */
    function withdraw(address vaultAddress, uint256 percentageOut) external override { 

        IBeefyVaultV6 vault = IBeefyVaultV6(vaultAddress);
        IERC20 mooToken = IERC20(vaultAddress);
        
        uint256 burnAmount = mooToken.balanceOf(address(this)) * percentageOut / 100000;

        // Compute balance of underlying asset before withdraw
        address assetReceived = vault.want();
        uint256 assetBalanceBefore = IERC20(assetReceived).balanceOf(address(this));
        vault.withdraw(burnAmount);

        // Compute balance of underlying asset after withdraw
        uint256 amountReceived = IERC20(assetReceived).balanceOf(address(this)) - assetBalanceBefore;

        emit DEFIBASKET_BEEFY_WITHDRAW(burnAmount, assetReceived, amountReceived);
    }  
    
}
