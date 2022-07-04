// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ITetuVault.sol";
import "../interfaces/ITetuDeposit.sol";

/**
 * @title TetuDepositBridge
 * @author DeFi Basket
 *
 * @notice Deposits, withdraws and harvest rewards from Tetu vaults in Polygon. Note that it uses proxy with eternal storage pattern.
 *
 * @dev This contract has 2 main functions:
 *
 * 1. Deposit and invest in Tetu vault 
 * 2. Withdraw from Tetu vault and claim rewards
 *
 */
/// @custom:security-contact hi@defibasket.org
contract TetuDepositBridge is ITetuDeposit {

    /**
      * @notice Deposits and invest into a Tetu vault 
      *
      * @dev Wraps Tetu vault's depositAndInvest(uint256 amount). Also generates the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param vaultAddress The address of the Tetu vault.
      * @param percentageIn Percentage of the balance of the asset that will be deposited
      */
    function deposit(address vaultAddress, uint256 percentageIn) external override {

        ITetuVault vault = ITetuVault(vaultAddress);

        IERC20 assetIn = IERC20(vault.underlying());        
        uint256 amountIn = assetIn.balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        assetIn.approve(vaultAddress, 0);
        assetIn.approve(vaultAddress, amountIn);

        vault.depositAndInvest(amountIn);

        emit DEFIBASKET_TETU_DEPOSIT(amountIn);
    }

    /**
      * @notice Withdraws from the Tetu vault. Partially depositing or withdrawing will not reset 
      *         the reward boost countdown. 
      *
      * @dev Wraps the Tetu vault's exit(). Also generates the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param vaultAddress The address of the Tetu vault.
      * @param percentageOut Percentage that will be withdrawn
      *
      */
    function withdraw(address vaultAddress, uint256 percentageOut) external override { 
        
        ITetuVault vault = ITetuVault(vaultAddress);        

        // Compute balance of underlying asset        
        IERC20 assetInVault = IERC20(vault.underlying());            
        uint256 assetBalanceBefore = assetInVault.balanceOf(address(this));

        // Withdraw xToken from the vault and claim any accumulated Tetu rewards
        IERC20 xToken = IERC20(vaultAddress);
        uint256 xTokenAmountOut = xToken.balanceOf(address(this)) * percentageOut / 100000;
        vault.withdraw(xTokenAmountOut); // Withdraw shares partially without touching rewards

        (address[] memory rewardTokens, uint256[] memory rewardBalancesOut) = _claimRewards(vault);
        // Compute amount of asset withdraw and total rewards for each reward token
        uint256 assetAmountOut = assetInVault.balanceOf(address(this)) - assetBalanceBefore;

        emit DEFIBASKET_TETU_WITHDRAW(xTokenAmountOut, assetAmountOut, rewardTokens, rewardBalancesOut);
    }
    
    /**
      * @notice Claim rewards from a vault without withdrawing the xToken
      *
      * @dev Wraps Tetu's getAllRewards() and generate the necessary events to communicate with DeFi Basket's UI and
      * back-end. 
      *
      * @param vaultAddress The address of the Tetu vault.
      *
      */    
    function claimRewards(address vaultAddress) public override { 
      ITetuVault vault = ITetuVault(vaultAddress);  
      (address[] memory rewardTokens, uint256[] memory rewardBalancesOut) = _claimRewards(vault);
      emit DEFIBASKET_TETU_CLAIM_REWARDS(rewardTokens, rewardBalancesOut);        

    }

    function _claimRewards(ITetuVault vault) internal returns (address[] memory, uint256[] memory){ 

        // Compute balance of reward tokens before exit is called 
        address[] memory rewardTokens = vault.rewardTokens();
        uint256 rewardTokensLength = rewardTokens.length;
        uint256[] memory rewardBalances = new uint256[](rewardTokensLength);
        uint256[] memory rewardBalancesOut = new uint256[](rewardTokensLength);        

        for(uint256 i = 0; i < rewardTokensLength; i = unchecked_inc(i)) { 
          rewardBalances[i] = IERC20(rewardTokens[i]).balanceOf(address(this));            
        }

        // Get rewards - note that this resets the claim bar
        vault.getAllRewards();
        for(uint256 i = 0; i < rewardTokensLength; i = unchecked_inc(i)) {
          rewardBalancesOut[i] = IERC20(rewardTokens[i]).balanceOf(address(this)) - rewardBalances[i];            
        }

        return (rewardTokens, rewardBalancesOut);
    }

    /**
      * @notice Increment integer without checking for overflow - only use in loops where you know the value won't overflow
      *
      * @param i Integer to be incremented
    */
    function unchecked_inc(uint256 i) internal pure returns (uint256) {
        unchecked {
            return i + 1;
        }
    }    
    
}
