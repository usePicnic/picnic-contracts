pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAutofarm.sol";

/**
 * @title AaveV2DepositBridge
 * @author IndexPool
 *
 * @notice Deposits, withdraws and harvest rewards from Aave's LendingPool contract in Polygon.
 *
 * @dev This contract has 3 main functions:
 *
 * 1. Deposit in Aave's LendingPool (example: DAI -> amDAI)
 * 2. Withdraw from Aave's LendingPool (example: amDAI -> DAI)
 * 3. Harvest rewards from deposits (as of September 2021 being paid in WMATIC, but we can support changes)
 *
 * Notice that we haven't implemented any kind of borrowing mechanisms, mostly because that would require control
 * mechanics to go along with it.
 *
 */

contract Autofarm {

    function deposit(uint256 poolId, address assetIn, uint256 percentageIn) external {
        // Hardcoded to make less variables needed for the user to check (UI will help explain/debug it)
        address autofarmAddress = 0x89d065572136814230A55DdEeDDEC9DF34EB0B76;
        IAutofarm autofarm = IAutofarm(autofarmAddress);

        uint256 amountIn = IERC20(assetIn).balanceOf(address(this)) * percentageIn / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetIn).approve(autofarmAddress, 0);
        IERC20(assetIn).approve(autofarmAddress, amountIn);

        autofarm.deposit(poolId, amountIn);
    }

    function withdraw(uint256 poolId, address assetOut, uint256 percentageOut) external {
        // Hardcoded to make less variables needed for the user to check (UI will help explain/debug it)
        address autofarmAddress = 0x89d065572136814230A55DdEeDDEC9DF34EB0B76;
        IAutofarm autofarm = IAutofarm(autofarmAddress);

        uint256 amountIn = IERC20(assetOut).balanceOf(address(this)) * percentageOut / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(assetOut).approve(autofarmAddress, 0);
        IERC20(assetOut).approve(autofarmAddress, amountIn);

        autofarm.withdraw(poolId, amountIn);
    }
}
