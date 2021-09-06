pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAutofarmV2_CrossChain.sol";
import "../../interfaces/IStake.sol";
import "./interfaces/IAutoFarmAddressToPoolId.sol";

/**
 * @title AutofarmDepositBridge
 * @author IndexPool
 *
 * @notice Deposits, withdraws and harvest rewards from AutofarmV2_CrossChain contract in Polygon.
 *
 * @dev This contract has 3 main functions:
 *
 * 1. Deposit in AutofarmV2_CrossChain (example: QUICK/ETH -> autofarm doesn't return a deposit token)
 * 2. Withdraw from AutofarmV2_CrossChain
 * 3. Harvest rewards from deposits (it is a withdraw of value 0)
 *
 */

contract AutofarmDepositBridge is IStake{
    // Hardcoded to make less variables needed for the user to check (UI will help explain/debug it)
    address constant autofarmAddress = 0x89d065572136814230A55DdEeDDEC9DF34EB0B76;
    address constant farmToPoolAddress = 0xd977422c9eE9B646f64A4C4389a6C98ad356d8C4;

    function deposit(address assetIn, uint256 percentageIn) external override {
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);

        uint256 amountIn = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(autofarmAddress, 0);
        IERC20(assetIn).approve(autofarmAddress, amountIn);

        // TODO how to get proper address before compile time?
        IAutoFarmAddressToPoolId addressToPool = IAutoFarmAddressToPoolId(farmToPoolAddress);
        uint256 poolId = addressToPool.getPoolId(assetIn);

        autofarm.deposit(poolId, amountIn);
    }

    function harvest(address asset) external override {
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);

        IAutoFarmAddressToPoolId addressToPool = IAutoFarmAddressToPoolId(farmToPoolAddress);
        uint256 poolId = addressToPool.getPoolId(asset);

        autofarm.withdraw(poolId, 0);
    }

    function withdraw(address assetOut, uint256 percentageOut) external override {
        IAutofarmV2_CrossChain autofarm = IAutofarmV2_CrossChain(autofarmAddress);

        IAutoFarmAddressToPoolId addressToPool = IAutoFarmAddressToPoolId(farmToPoolAddress);
        uint256 poolId = addressToPool.getPoolId(assetOut);

        uint256 amountOut = autofarm.stakedWantTokens(poolId, address(this)) * percentageOut / 100000;
        autofarm.withdraw(poolId, amountOut);
    }
}
