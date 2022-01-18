// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IHarvestVault.sol";
import "./interfaces/IHarvestPool.sol";
import "../interfaces/IHarvestDeposit.sol";

/**
 * @title HarvestDepositBridge
 * @author DeFi Basket
 *
 * @notice Deposits, withdraws and harvest rewards from harvest vaults in Polygon.
 *
 * @dev This contract has 2 main functions:
 *
 * 1. Deposit in Harvest vault and stake fASSET in corresponding pool
 * 2. Withdraw from Harvest vault and claim rewards
 *
 */

contract HarvestDepositBridge is IHarvestDeposit {

    /**
      * @notice Deposits into a Harvest vault and automatically stakes in the corresponding pool
      *
      * @dev Wraps the Harvest vault deposit and pool stake. Also generates the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param poolAddress The address of the Harvest pool.
      * @param percentageIn Percentage of the balance of the asset that will be deposited
      */
    function deposit(address poolAddress, uint256 percentageIn) external override {

        address vaultAddress = IHarvestPool(poolAddress).lpToken(); /* lpToken returns the proxy (and not the implementation address) */        
        IHarvestVault vault = IHarvestVault(vaultAddress);

        IERC20 assetIn = IERC20(vault.underlying());        
        uint256 amountIn = assetIn.balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        assetIn.approve(vaultAddress, 0);
        assetIn.approve(vaultAddress, amountIn);

        vault.deposit(amountIn);

        // Stake token in reward pool
        IERC20 vaultToken = IERC20(vaultAddress);
        uint256 vaultTokenBalance = vaultToken.balanceOf(address(this));
        vaultToken.approve(poolAddress, vaultTokenBalance);                
        IHarvestPool(poolAddress).stake(vaultTokenBalance);

        emit DEFIBASKET_HARVEST_DEPOSIT(amountIn);
    }

    /**
      * @notice Withdraws from the Harvest vault.
      *
      * @dev Wraps the Harvest vault withdraw and the pool exit. Also generates the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param poolAddress The address of the Harvest pool.
      * @param percentageOut Percentage of fAsset that will be withdrawn
      *
      */
    function withdraw(address poolAddress, uint256 percentageOut) external override { 

        address vaultAddress = IHarvestPool(poolAddress).lpToken(); /* lpToken returns the proxy (and not the implementation address) */        
        IHarvestVault vault = IHarvestVault(vaultAddress);          
        
        IHarvestPool pool = IHarvestPool(poolAddress);
        IERC20 assetInVault = IERC20(vault.underlying());            
                
        // Compute balance of reward tokens before exit is called 
        uint256 rewardTokensLength = pool.rewardTokensLength();
        address[] memory rewardTokens = new address[](rewardTokensLength);        
        uint256[] memory rewardBalances = new uint256[](rewardTokensLength);
        uint256[] memory rewardBalancesOut = new uint256[](rewardTokensLength);

        for(uint256 i = 0; i < rewardTokensLength; i++) { 
          rewardTokens[i] = pool.rewardTokens(i);
          rewardBalances[i] = IERC20(rewardTokens[i]).balanceOf(address(this));            
        }

        // Returns the staked fASSET to the Wallet in addition to any accumulated FARM rewards
        pool.exit();

        // Burn fASSET and withdraw corresponding asset from Vault 
        IERC20 vaultToken = IERC20(vaultAddress);
        uint256 assetBalanceBefore = assetInVault.balanceOf(address(this));
        uint256 fAssetAmountOut = vaultToken.balanceOf(address(this)) * percentageOut / 100000;
        vault.withdraw(fAssetAmountOut);       
        uint256 assetAmountOut = assetInVault.balanceOf(address(this)) - assetBalanceBefore;

        // Compute total rewards for each reward token
        for(uint256 i = 0; i < rewardTokensLength; i++) {
          rewardBalancesOut[i] = IERC20(rewardTokens[i]).balanceOf(address(this)) - rewardBalances[i];            
        }

        emit DEFIBASKET_HARVEST_WITHDRAW(fAssetAmountOut, assetAmountOut, rewardTokens, rewardBalancesOut);
    }

    
    /**
      * @notice Claim rewards from a pool without unstaking the fASSET
      *
      * @dev Wraps the Harvest getAllRewards and generate the necessary events to communicate with DeFi Basket's UI and
      * back-end. 
      *
      * @param poolAddress The address of the Harvest pool.
      *
      */    
    function claimRewards(address poolAddress) external override { 

        IHarvestPool pool = IHarvestPool(poolAddress);
                
        // Compute balance of reward tokens before exit is called 
        uint256 rewardTokensLength = pool.rewardTokensLength();
        address[] memory rewardTokens = new address[](rewardTokensLength);
        uint256[] memory rewardBalances = new uint256[](rewardTokensLength);
        uint256[] memory rewardBalancesOut = new uint256[](rewardTokensLength);
        
        for(uint256 i = 0; i < rewardTokensLength; i++) {
          rewardTokens[i] = pool.rewardTokens(i);
          rewardBalances[i] = IERC20(rewardTokens[i]).balanceOf(address(this));            
        }
        
        pool.getAllRewards();

        // Compute total rewards for each reward token
        for(uint256 i = 0; i < rewardTokensLength; i++) {
          rewardBalancesOut[i] = IERC20(rewardTokens[i]).balanceOf(address(this)) - rewardBalances[i];            
        }

        emit DEFIBASKET_HARVEST_CLAIM(rewardTokens, rewardBalancesOut);        


    }
    
}
