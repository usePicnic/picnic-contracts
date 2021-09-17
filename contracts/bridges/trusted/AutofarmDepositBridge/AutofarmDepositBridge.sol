// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAutofarmV2_CrossChain.sol";
import "../../interfaces/IAutofarmDeposit.sol";

/**
 * @title AutofarmDepositBridge
 * @author IndexPool
 *
 * @notice Deposits, withdraws and harvest rewards from AutofarmV2_CrossChain contract in Polygon.
 *
 * @dev This contract has 2 main functions:
 *
 * 1. Deposit in AutofarmV2_CrossChain (example: QUICK/ETH -> autofarm doesn't return a deposit token)
 * 2. Withdraw from AutofarmV2_CrossChain
 *
 */

contract AutofarmDepositBridge is IAutofarmDeposit {
    // Hardcoded to make less variables needed for the user to check (UI will help explain/debug it)
    address constant autofarmAddress = 0x89d065572136814230A55DdEeDDEC9DF34EB0B76;
    address constant wMaticAddress = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
    address constant pAutoAddress = 0x7f426F6Dc648e50464a0392E60E1BB465a67E9cf;

    /**
      * @notice Deposits into the Autofarm protocol.
      *
      * @dev Wraps the Autofarm deposit and generate the necessary events to communicate with IndexPool's UI and back-end.
      *
      * @param percentageIn Percentage of the balance of the asset that will be deposited
      */
    function deposit(uint256 poolId, uint256 percentageIn) external override {
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);
        (IERC20 assetIn, , , , address vaultAddress) = autofarm.poolInfo(poolId);

        uint256 amountIn = assetIn.balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        assetIn.approve(autofarmAddress, 0);
        assetIn.approve(autofarmAddress, amountIn);

        autofarm.deposit(poolId, amountIn);

        emit INDEXPOOL_AUTOFARM_DEPOSIT(vaultAddress, address(assetIn), amountIn);
    }

    /**
      * @notice Withdraws from the Autofarm protocol.
      *
      * @dev Wraps the Autofarm withdraw and generate the necessary events to communicate with IndexPool's UI and
      * back-end. A harvest is withdraw where percentageOut == 0.
      *
      * @param poolId Autofarm pool id
      * @param percentageOut Percentage of the balance of the asset that will be withdrawn
      */
    function withdraw(uint256 poolId, uint256 percentageOut) external override {
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);
        (IERC20 assetOut, , , , address vaultAddress) = autofarm.poolInfo(poolId);

        uint256 wMaticBalance = IERC20(wMaticAddress).balanceOf(address(this));
        uint256 pAutoBalance = IERC20(pAutoAddress).balanceOf(address(this));

        uint256 amountOut = autofarm.stakedWantTokens(poolId, address(this)) * percentageOut / 100000;
        autofarm.withdraw(poolId, amountOut);

        uint256 wMaticReward = IERC20(wMaticAddress).balanceOf(address(this)) - wMaticBalance;
        uint256 pAutoReward = IERC20(pAutoAddress).balanceOf(address(this)) - pAutoBalance;

        emit INDEXPOOL_AUTOFARM_WITHDRAW(vaultAddress, address(assetOut), amountOut, wMaticReward, pAutoReward);
    }
}
